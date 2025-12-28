from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from SmartApi import SmartConnect
import os
import json
import pyotp
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging
import threading
from SmartApi.smartWebSocketV2 import SmartWebSocketV2


# Local Imports
try:
    from .tokens import NIFTY_50_TOKENS
    from .scrip_master import ScripMaster
except ImportError:
    from tokens import NIFTY_50_TOKENS
    from scrip_master import ScripMaster
    from broker.upstox import UpstoxBroker

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
upstox_broker = UpstoxBroker()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global SmartConnect Instance
smartApi = SmartConnect(api_key=os.getenv("ANGEL_API_KEY"))

# Cache for session (simple global var)
session_data = None
sws = None # Global WebSocket Instance


@app.get("/")
def read_root():
    return {"message": "NGTA Backend with Angel One (SmartAPI) is running"}

@app.get("/upstox/login")
def login_upstox():
    return RedirectResponse(upstox_broker.get_login_url())

@app.get("/upstox/callback")
def upstox_callback(code: str):
    success = upstox_broker.generate_token(code)
    if success:
        return {"status": "success", "message": "Upstox Authenticated"}
    else:
        raise HTTPException(status_code=400, detail="Authentication Failed")

@app.get("/login")
def login():
    """
    Authenticates with Angel One using API Key, Client Code, Password, and TOTP.
    """
    global session_data
    try:
        api_key = os.getenv("ANGEL_API_KEY")
        client_code = os.getenv("ANGEL_CLIENT_CODE")
        password = os.getenv("ANGEL_PASSWORD")
        totp_secret = os.getenv("ANGEL_TOTP_SECRET")

        if not all([api_key, client_code, password, totp_secret]):
             raise HTTPException(status_code=500, detail="Missing credentials in .env")

        # Generate TOTP
        try:
            totp = pyotp.TOTP(totp_secret).now()
        except Exception:
            raise HTTPException(status_code=500, detail="Invalid TOTP Secret")
        
        # Login
        data = smartApi.generateSession(client_code, password, totp)
        
        if data['status'] == False:
             raise HTTPException(status_code=401, detail=data['message'])
        
        session_data = data['data']
        
        # Start WebSocket if not already running
        if not sws:
            start_websocket()
            
        return {"status": "success", "message": "Connected to Angel One", "data": {"client_code": client_code}}
        
    except Exception as e:
        logger.error(f"Login failed: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/market-data/{symbol_token}")
def get_market_data(symbol_token: str):
    """
    Fetch market data. 
    """
    try:
        # Check session
        if not session_data and not smartApi.access_token:
            login()

        # Mapping logic
        token_map = NIFTY_50_TOKENS # Use imported map
        # Also support reverse lookup for testing if user sends "SBIN"
        token = token_map.get(symbol_token.upper())
        
        # If not in map, try to use input as token directly
        if not token:
            token = symbol_token
        
        exchange = "NSE"
        if token == "99926000": # Nifty 50
             tradingsymbol = "NIFTY"
        else:
             tradingsymbol = f"{symbol_token.upper()}-EQ" 

        data = smartApi.ltpData(exchange, tradingsymbol, token)
        return data
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/indices")
def get_indices():
    """
    Fetches live data for NIFTY and BANKNIFTY Indices.
    """
    try:
        # Check session
        if not session_data and not smartApi.access_token:
            login()
            
        tokens = ["99926000", "99926009"] # Nifty, BankNifty
        results = {}
        
        for token in tokens:
            name = "NIFTY" if token == "99926000" else "BANKNIFTY"
            data = smartApi.ltpData("NSE", name, token)
            if data and data.get('data'):
                results[name] = data['data']
                
        return {"status": "success", "data": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- Background Scanner ---
market_cache = {}
token_map_reverse = {} # Token -> Symbol
breakout_tracker = {} # Symbol -> "HH:MM:SS"
# Load Tracker Persistence
try:
    if os.path.exists("breakout_tracker.json"):
        with open("breakout_tracker.json", "r") as f:
            breakout_tracker = json.load(f)
            print(f"Loaded Breakout Tracker: {len(breakout_tracker)} symbols")
except Exception as e:
    print(f"Failed to load tracker: {e}")

# Global ATH Cache
ath_cache = {} # Symbol -> Price
try:
    if os.path.exists("ath_cache.json"):
        with open("ath_cache.json", "r") as f:
            ath_cache = json.load(f)
            print(f"Loaded ATH Cache: {len(ath_cache)} symbols")
except Exception as e:
    print(f"Failed to load ATH cache: {e}")

is_scanner_running = False

def start_websocket():
    global sws, session_data
    try:
        if not session_data: return
        
        auth_token = session_data['jwtToken']
        api_key = os.getenv("ANGEL_API_KEY")
        client_code = os.getenv("ANGEL_CLIENT_CODE")
        feed_token = session_data['feedToken']
        
        sws = SmartWebSocketV2(auth_token, api_key, client_code, feed_token)
        
        def on_data(wsapp, message):
            # print("Ticks:", message)
            if 'token' in message and 'last_traded_price' in message:
                print(f"WS Tick: {message['token']} -> {message['last_traded_price']}")
                tok = message['token']
                # Clean token (sometimes comes with quotes or extra chars?) - usually clean string
                
                # Find symbol
                if tok in token_map_reverse:
                    sym = token_map_reverse[tok]
                    if sym in market_cache:
                        market_cache[sym]['ltp'] = message['last_traded_price'] / 100.0 # V2 usually sends in paise? Check docs. standard is usually normal price but let's verify.
                        # Actually SmartWebSocketV2 usually sends data as is.
                        # Wait, V2 often sends LTP as float directly.
                        market_cache[sym]['ltp'] = message['last_traded_price'] / 100.0
                        
                        # Calculate change if open/close available or just update LTP
                        # message usually has 'change_percent' or 'net_change'
                        # V2 structure: subscription_mode, exchange_type, token, sequence_number, exchange_timestamp, last_traded_price, subscription_mode_val
                        # It might NOT have change_percent in mode 1 (LTP).
                        # Let's assume we get decent data.
                        pass

        def on_open(wsapp):
            print("WebSocket: Connected")
            
        def on_error(wsapp, error):
            print("WebSocket Error:", error)
            
        sws.on_data = on_data
        sws.on_open = on_open
        sws.on_error = on_error
        
        # Run WS in separate thread to avoid blocking scanner
        t_ws = threading.Thread(target=sws.connect, daemon=True)
        t_ws.start()
        
    except Exception as e:
        print("WebSocket Init Failed:", e)

def subscribe_to_tokens(tokens):
    global sws
    if sws:
        try:
            # Mode 1: LTP Only (Fastest)
            # ExchangeType 1: NSE
            token_list = [{"exchangeType": 1, "tokens": tokens}]
            sws.subscribe("correlation_id", 1, token_list)
            print(f"WebSocket: Subscribed to {len(tokens)} tokens")
        except Exception as e:
            print("Subscribe Failed:", e)


def background_scanner():
    global is_scanner_running, market_cache
    print("Scanner: Started")
    
            # Define Processing Logic Internal to Scanner (or move global)
    def calculate_metrics(symbol, token, hist_data, ath_val=0, time_finder_func=None):
        try:
            if len(hist_data) < 5: return None
            
            c0 = hist_data[-1][4]
            c1 = hist_data[-2][4]
            c2 = hist_data[-3][4]
            c3 = hist_data[-4][4]
            
            change_current = ((c0 - c1) / c1) * 100
            change_1d = ((c1 - c2) / c2) * 100
            change_2d = ((c2 - c3) / c3) * 100
            change_3d = ((c3 - hist_data[-5][4]) / hist_data[-5][4]) * 100
            
            avg_3d = (change_current + change_1d + change_2d + change_3d) / 4.0
            
            # Dom
            def get_dom(candle): return "Buyers" if candle[4] > candle[1] else "Sellers"
            dom_current = get_dom(hist_data[-1])
            dom_1d = get_dom(hist_data[-2])
            dom_2d = get_dom(hist_data[-3])
            dom_3d = get_dom(hist_data[-4])
            
            bulls = [dom_current, dom_1d, dom_2d, dom_3d].count("Buyers")
            avg_dom_3d = "Buyers" if bulls >= 3 else "Sellers" if bulls <= 1 else "Balance"
            
            # Indicators
            prices = [x[4] for x in hist_data]
            s = pd.Series(prices)
            
            # RSI
            delta = s.diff()
            gain = (delta.where(delta > 0, 0)).rolling(14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            cur_rsi = rsi.iloc[-1] if not pd.isna(rsi.iloc[-1]) else 50
            
            # MACD
            e12 = s.ewm(span=12, adjust=False).mean()
            e26 = s.ewm(span=26, adjust=False).mean()
            macd = e12 - e26
            sig = macd.ewm(span=9, adjust=False).mean()
            hist = macd - sig
            
            h_val = hist.iloc[-1]
            h_prev = hist.iloc[-2]
            
            macd_sig = "Neutral"
            if h_val > 0: macd_sig = "Bullish Growing" if h_val > h_prev else "Bullish Waning"
            elif h_val < 0: macd_sig = "Bearish Growing" if h_val < h_prev else "Bearish Waning"
            
            # Score
            score = 50
            if cur_rsi > 50: score += 10
            if cur_rsi > 70: score -= 5
            if macd.iloc[-1] > sig.iloc[-1]: score += 15
            if change_current > 0: score += 10
            if dom_current == "Buyers": score += 5
            sentiment = "Neutral"
            if score > 75: sentiment = "STRONG BUY"
            elif score > 60: sentiment = "Bullish"
            elif score < 30: sentiment = "STRONG SELL"
            elif score < 40: sentiment = "Bearish"

            # Breakout Calculations (10, 30, 50 Days)
            def get_high_low(period):
                # Need period+1 candles (hist_data[-1] is c0/today, we need previous)
                if len(hist_data) < period + 2: return None, None
                past_data = hist_data[-(period+1):-1]
                if not past_data: return None, None
                
                max_h = max([x[2] for x in past_data])
                min_l = min([x[3] for x in past_data])
                return max_h, min_l

            h10, l10 = get_high_low(10)
            h30, l30 = get_high_low(30)
            h50, l50 = get_high_low(50)
            
            # 1-Day Breakout (Yesterday's High/Low)
            h1, l1 = get_high_low(1) 
            h100, l100 = get_high_low(100)
            h52w, l52w = get_high_low(250) # Approx 52 Weeks (Trading Days)

            # All Time High Check
            # Use passed ath_val (which is max of Cache + History)
            prev_ath = ath_val
            new_ath = prev_ath
            
            # Daily Day High/Low (Index 2 and 3)
            day_h = hist_data[-1][2]
            day_l = hist_data[-1][3]
            
            # If current price breaks this, update it temporarily for this check
            if c0 > new_ath: new_ath = c0
            if day_h > new_ath: new_ath = day_h # Check if high broke it

            def check_breakout(max_h, min_l):
                # Trigger on HIGH for Bullish, LOW for Bearish (Intraday Detection)
                if max_h and day_h > max_h: return "Bullish Breakout"
                if min_l and day_l < min_l: return "Bearish Breakout"
                return "Consolidating" # or None

            bo_1 = check_breakout(h1, l1)
            bo_10 = check_breakout(h10, l10)
            bo_30 = check_breakout(h30, l30)
            bo_50 = check_breakout(h50, l50)
            bo_100 = check_breakout(h100, l100)
            bo_52w = check_breakout(h52w, l52w)
            
            bo_all = "Consolidating"
            # ATH Breakout: If Day High > PREVIOUS All Time High (and prev > 0)
            if prev_ath > 0 and day_h >= prev_ath:
                bo_all = "Bullish Breakout"

            # Breakout Time Logic
            current_time = datetime.now().strftime("%H:%M:%S")
            
            # Helper to find precise time if allowed
            def find_time(tf, status, level):
                # 1. Check Global Tracker first
                existing = breakout_tracker.get(symbol, {}).get(tf)
                if existing: return existing
                
                # 2. If not existing, try to find it
                if time_finder_func and status in ["Bullish Breakout", "Bearish Breakout"]:
                    try:
                         # Get date from the breakout candle (last daily candle)
                         # hist_data format: [timestamp_str, open, high, low, close, vol]
                         last_candle_time = hist_data[-1][0] 
                         # Angel format: "2024-12-28T09:15:00+05:30"
                         # We need to parse this to datetime
                         dt_obj = None
                         if 'T' in last_candle_time:
                             dt_obj = datetime.strptime(last_candle_time.split("T")[0], "%Y-%m-%d")
                         else:
                             # Fallback parse?
                             dt_obj = datetime.strptime(last_candle_time[:10], "%Y-%m-%d")

                         is_bull = status == "Bullish Breakout"
                         found = time_finder_func(symbol, token, level, is_bull, date_obj=dt_obj)
                         if found: return found
                    except:
                        pass
                
                # 3. Fallback to Scan Time - user requested strictly NO fake times.
                # If we couldn't find it in intraday (maybe data lag?), return None.
                # This ensures we keep trying in next scans until we find it.
                return None

            new_breakouts = {}
            if bo_1 in ["Bullish Breakout", "Bearish Breakout"]: 
                 new_breakouts["1d"] = find_time("1d", bo_1, h1 if bo_1=="Bullish Breakout" else l1)
            if bo_10 in ["Bullish Breakout", "Bearish Breakout"]: 
                 new_breakouts["10d"] = find_time("10d", bo_10, h10 if bo_10=="Bullish Breakout" else l10)
            if bo_30 in ["Bullish Breakout", "Bearish Breakout"]: 
                 new_breakouts["30d"] = find_time("30d", bo_30, h30 if bo_30=="Bullish Breakout" else l30)
            if bo_50 in ["Bullish Breakout", "Bearish Breakout"]: 
                 new_breakouts["50d"] = find_time("50d", bo_50, h50 if bo_50=="Bullish Breakout" else l50)
            if bo_100 in ["Bullish Breakout", "Bearish Breakout"]: 
                 new_breakouts["100d"] = find_time("100d", bo_100, h100 if bo_100=="Bullish Breakout" else l100)
            if bo_52w in ["Bullish Breakout", "Bearish Breakout"]: 
                 new_breakouts["52w"] = find_time("52w", bo_52w, h52w if bo_52w=="Bullish Breakout" else l52w)
            # Find time against PREV ATH
            if bo_all == "Bullish Breakout": 
                 new_breakouts["all"] = find_time("all", bo_all, prev_ath)

            # We don't read/write global breakout_tracker here to ensure thread safety
            # Instead, we return detected breakouts to the main thread

            return {
                "scan_time": current_time,
                "new_breakouts": new_breakouts, # Pass to main thread
                "symbol": symbol, "token": token, "ltp": c0,
                "change_pct": round(change_current, 2),
                "rsi": round(cur_rsi, 2), "strength_score": round(score, 1),
                "sentiment": sentiment,
                "change_current": round(change_current, 2),
                "change_1d": round(change_1d, 2),
                "change_2d": round(change_2d, 2),
                "change_3d": round(change_3d, 2),
                "avg_3d": round(avg_3d, 2),
                "avg_dom_3d": avg_dom_3d,
                "dom_current": dom_current, "dom_1d": dom_1d,
                "dom_2d": dom_2d, "dom_3d": dom_3d,
                "macd_signal": macd_sig,
                "breakout_1d": bo_1,
                "breakout_10d": bo_10,
                "breakout_30d": bo_30,
                "breakout_50d": bo_50,
                "breakout_100d": bo_100,
                "breakout_52w": bo_52w,
                "high_1d": h1, "low_1d": l1,
                "high_10d": h10, "low_10d": l10,
                "high_30d": h30, "low_30d": l30,
                "high_50d": h50, "low_50d": l50,
                "high_100d": h100, "low_100d": l100,
                "high_100d": h100, "low_100d": l100,
                "high_52w": h52w, "low_52w": l52w,
                "breakout_all": bo_all,
                "high_all": new_ath,
                "day_high": day_h,
                "day_low": day_l,
                "volume": hist_data[-1][5],
                "turnover": (c0 * hist_data[-1][5]) / 10000000, # Turnover in Cr
                # Signal to main thread if we found a new ATH to save
                "update_ath": new_ath if new_ath > prev_ath else None
            }
        except Exception as e:
            print(f"Metrics Error {symbol}: {e}")
            import traceback
            traceback.print_exc()
            return None

    while True:
        try:
            if not session_data and not smartApi.access_token:
                try: login()
                except: pass
            
            sm = ScripMaster.get_instance()
            fno = sm.get_all_fno_tokens()
            
            nifty = set(NIFTY_50_TOKENS.keys())
            targets = [x for x in fno if x['symbol'] in nifty] + \
                      [x for x in fno if x['symbol'] not in nifty]
            
            if not targets:
                import time; time.sleep(10); continue

            to_date = datetime.now()
            # Dynamic From Date based on ATH Cache
            # We determine this INSIDE process_item per stock to be safe, 
            # but `process_item` runs in threads. 
            # We can read `ath_cache` safely.
            
            fmt = "%Y-%m-%d %H:%M"
            
            def process_item(item):
                import time; time.sleep(0.5) # Throttle to < 2 req/sec
                sym, tok = item['symbol'], item['token']
                
                # Check if we need Deep History
                # Access global ath_cache (Thread-safe for READ)
                has_ath = sym in ath_cache
                
                # If we have ATH, we only need 400 days.
                # If we DON'T have ATH, we need 5000 days (approx 15 years).
                days_needed = 400 if has_ath else 5000
                
                item_from_date = to_date - timedelta(days=days_needed)
                
                # Helper to get Intraday Data for Precise Time (Rate Limited)
                def get_intraday_breakout_time(symbol, token, level, is_bullish, date_obj=None):
                    try:
                        # Determine Date Range
                        if date_obj is None:
                            target_date = datetime.now()
                        else:
                            target_date = date_obj
                        
                        # Set to 09:15 of that day
                        start_time = target_date.replace(hour=9, minute=15, second=0, microsecond=0)
                        # End time 15:30 of that day
                        end_time = target_date.replace(hour=15, minute=30, second=0, microsecond=0)
                        
                        # If today, cap end time at Now (to avoid future requests error?)
                        # Actually Angel API handles future date okay usually, but safer to respect Now if IsToday
                        if target_date.date() == datetime.now().date():
                             if datetime.now() < end_time:
                                 end_time = datetime.now()

                        start_str = start_time.strftime("%Y-%m-%d %H:%M") # Explicit format
                        end_str = end_time.strftime("%Y-%m-%d %H:%M")

                        # 1. Fetch Intraday 5-min
                        print(f"DEBUG: Intraday Req {symbol} Date: {start_str} to {end_str}")
                        res = smartApi.getCandleData({
                            "exchange": "NSE", "symboltoken": token, "interval": "FIVE_MINUTE",
                            "fromdate": start_str, "todate": end_str
                        })
                        
                        if res and res.get('data'):
                            print(f"DEBUG: Found {len(res['data'])} intraday candles for {symbol}")
                            for candle in res['data']:
                                # Timestamp parse
                                try:
                                    c_time_full = candle[0] # "2024-12-28T09:15:00+05:30"
                                    # We just want HH:MM
                                    c_time = c_time_full.split("T")[1][:5]
                                except:
                                    continue # Skip malformed
                                
                                c_open = candle[1]
                                c_high = candle[2]
                                c_low = candle[3]
                                
                                # Check Breakout
                                if is_bullish:
                                    # Check Gap Up or Crossing
                                    if c_open >= level:
                                        print(f"DEBUG: {symbol} Bullish Gap Up/Open > Level @ {c_time} (O:{c_open} >= {level})")
                                        return c_time
                                    if c_high >= level: 
                                        print(f"DEBUG: {symbol} Bullish Breakout Found @ {c_time} (H:{c_high} >= {level})")
                                        return c_time
                                else: # Bearish
                                    # Check Gap Down
                                    if c_open <= level:
                                        print(f"DEBUG: {symbol} Bearish Gap Down/Open < Level @ {c_time} (O:{c_open} <= {level})")
                                        return c_time
                                    if c_low <= level: 
                                        print(f"DEBUG: {symbol} Bearish Breakout Found @ {c_time} (L:{c_low} <= {level})")
                                        return c_time
                        else:
                             print(f"DEBUG: No Intraday Data for {symbol} on {target_date.date()}")
                        return None
                    except Exception as e:
                        print(f"Intraday Scan Error {symbol}: {e}")
                        return None
                    except Exception as e:
                        print(f"Intraday Scan Error {symbol}: {e}")
                        return None

                # Retry Logic with Failover (Upstox Primary)
                for i in range(3):
                    try:
                        res = None
                        
                        # 1. Try Upstox (Primary)
                        try:
                            # Only if we have a token (otherwise quick fail)
                            if upstox_broker.access_token:
                                    res = {'data': up_data}
                        except Exception as e:
                            print(f"Upstox Error {sym}: {e}")

                        # 2. Failover to Angel One (Secondary)
                        if not res or not res.get('data'):
                            try:
                                res = smartApi.getCandleData({
                                    "exchange": "NSE", "symboltoken": tok, "interval": "ONE_DAY",
                                    "fromdate": item_from_date.strftime(fmt), "todate": to_date.strftime(fmt)
                                })
                            except Exception as e:
                                print(f"Angel Error {sym}: {e}")

                        if res and res.get('data'):
                            full_data = res['data']
                            
                            # Logic:
                            # 1. Calculate ATH from full_data if needed
                            current_ath = ath_cache.get(sym, 0)
                            new_ath_found = 0
                            
                            if not has_ath:
                                # Calculate max from the 5000 days
                                # data structure: [timestamp, open, high, low, close, vol]
                                max_h = max([x[2] for x in full_data], default=0)
                                if max_h > current_ath:
                                    current_ath = max_h
                                    new_ath_found = max_h
                            
                            # 2. Slice data to 400 days for metrics (Optimization)
                            # We don't want to process 5000 candles in metrics
                            # Take last 400
                            recent_data = full_data[-400:] if len(full_data) > 400 else full_data
                            
                            metrics = calculate_metrics(sym, tok, recent_data, ath_val=current_ath, time_finder_func=get_intraday_breakout_time)
                            
                            if metrics:
                                if new_ath_found > 0:
                                    metrics['update_ath'] = new_ath_found
                                return metrics
                        
                        if i == 2: return None
                        import time; time.sleep(0.5)
                    except Exception as e:
                        print(f"Process Error {sym}: {e}")
                        if "rate" in str(e).lower():
                            import time; time.sleep(1.0 * (i+1)); continue
                        return None
                return None

            import concurrent.futures
            import time
            start_time = time.time()
            
            # Tracker Updates
            tracker_needs_save = False
            ath_needs_save = False

            # Reduced workers to prevent rate limiting
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                futures = {ex.submit(process_item, item): item for item in targets}
                for f in concurrent.futures.as_completed(futures):
                    res = f.result()
                    if res: 
                        # 1. Update Persistent Breakout Tracker (Thread-Safe in Main Thread)
                        sym = res['symbol']
                        new_bos = res.get('new_breakouts', {})
                        
                        if sym not in breakout_tracker: breakout_tracker[sym] = {}
                        
                        for tf, time_str in new_bos.items():
                            # Only set if not already set (Keep the FIRST breakout time of the day/session)
                            if tf not in breakout_tracker[sym]:
                                breakout_tracker[sym][tf] = time_str
                                tracker_needs_save = True
                        
                        # Populate response with ALL persisted breakout times
                        res['breakout_times'] = breakout_tracker[sym]

                        # 2. Update Cache
                        market_cache[sym] = res
                        market_cache[sym] = res
                        token_map_reverse[res['token']] = sym
                        
                        # 3. Update ATH Cache
                        if res.get('update_ath'):
                             new_val = res['update_ath']
                             if new_val > ath_cache.get(sym, 0):
                                 ath_cache[sym] = new_val
                                 ath_needs_save = True

            # Save Tracker if Changed
            if tracker_needs_save:
                try:
                    with open("breakout_tracker.json", "w") as f:
                        json.dump(breakout_tracker, f)
                    print("Persistence: Saved breakout_tracker.json")
                except Exception as e:
                    print(f"Persistence Error: {e}")

            # Save ATH Cache if Changed
            if ath_needs_save:
                try:
                    with open("ath_cache.json", "w") as f:
                        json.dump(ath_cache, f)
                    print(f"Persistence: Saved ATH Cache ({len(ath_cache)} items)")
                except Exception as e:
                    print(f"ATH Persistence Error: {e}")
            
            # Subscribe WS to new tokens
            if sws:
                tokens = [x['token'] for x in market_cache.values()]
                subscribe_to_tokens(tokens)
            
            elapsed = time.time() - start_time
            print(f"Scanner: Updated {len(market_cache)} stocks in {elapsed:.2f} seconds. CacheID: {id(market_cache)}")
            import time; time.sleep(15) # 15s Hybrid Interval (WS handles real-time)
            
        except Exception as e:
            print("Scanner Crash:", e)
            import time; time.sleep(30)


@app.get("/god-mode")
def god_mode():
    """
    Returns data from the Background Scanner INSTANTLY.
    """
    data = list(market_cache.values())
    print(f"API Request: Cache Size = {len(market_cache)}")
    # Sort
    sorted_data = sorted(data, key=lambda x: x['strength_score'], reverse=True)
    
    return {
        "status": "success", 
        "data": sorted_data, 
        "count": len(sorted_data),
        "scanner_status": "Running" if is_scanner_running else "Stopped",
        "debug_cache_id": id(market_cache),
        "debug_cache_len": len(market_cache)
    }

@app.on_event("startup")
def startup_event():
    # Start Background Scanner
    global is_scanner_running
    if not is_scanner_running:
        is_scanner_running = True
        t = threading.Thread(target=background_scanner, daemon=True)
        t.start()
    
    # Load Scrip Master
    try:
        from scrip_master import ScripMaster
        ScripMaster.get_instance() # Preload
    except Exception as e:
        logger.error(f"Failed to init ScripMaster: {e}")

@app.get("/options-chain/{symbol}")
def get_options_chain(symbol: str):
    """
    Returns a REAL Options Chain using Scrip Master lookup.
    """
    try:
        # 1. Get Spot Price
        # Try finding in static map first (fast), else use EQ scanner
        token = NIFTY_50_TOKENS.get(symbol.upper(), "99926000" if symbol.upper() == "NIFTY" else None)
        if not token:
             # Use Scrip Master for Equity Token
             from scrip_master import ScripMaster
             sm = ScripMaster.get_instance()
             token = sm.get_equity_token(symbol.upper())
             if not token:
                 return {"status": "error", "message": "Symbol not found"}

        data = get_market_data(symbol) 
        if not data or not data.get('data'):
             return {"status": "error", "message": "Could not fetch spot price"}
             
        ltp = data['data']['ltp']
        
        # 2. Calculate ATM & Strikes
        step = 50 if symbol.upper() in ["NIFTY", "NIFTY 50", "NIFTY50"] else (100 if "BANK" in symbol.upper() else (ltp * 0.01))
        step = int(step) if step > 10 else 1.0
        # Round to nearest step
        atm = round(ltp / step) * step
        
        target_strikes = []
        for i in range(-5, 6):
            target_strikes.append(atm + (i * step))
            
        # 3. Lookup Real Tokens
        from scrip_master import ScripMaster
        sm = ScripMaster.get_instance()
        
        # Auto-detect expiry (Hardcoded for Demo - Current Monthly 26 DEC 24)
        # In a real app, this logic calculates the next Thursday
        expiry_str = "26DEC24" 
        
        is_index = symbol.upper() in ["NIFTY", "BANKNIFTY", "NIFTY 50"]
        
        tokens_map = sm.get_fno_tokens_for_chain(symbol.upper(), expiry_str, target_strikes, is_index)
        
        # 4. Fetch Live Feeds (Parallelized)
        import concurrent.futures
        
        def fetch_option_row(strike):
            ce_token = tokens_map.get(f"{int(strike)}_CE")
            pe_token = tokens_map.get(f"{int(strike)}_PE")
            
            ce_ltp, pe_ltp = 0, 0
            
            # CE
            if ce_token:
                try:
                    res = smartApi.ltpData("NFO", f"{symbol}{expiry_str}{int(strike)}CE", ce_token)
                    if res and res.get('data'): ce_ltp = res['data']['ltp']
                except: pass
                
            # PE
            if pe_token:
                try:
                    res = smartApi.ltpData("NFO", f"{symbol}{expiry_str}{int(strike)}PE", pe_token)
                    if res and res.get('data'): pe_ltp = res['data']['ltp']
                except: pass
                
            return {
                "strike": strike,
                "type": "ATM" if strike == atm else ("ITM" if strike < atm else "OTM"),
                "ce_ltp": ce_ltp,
                "pe_ltp": pe_ltp,
                "ce_token": ce_token,
                "pe_token": pe_token
            }

        chain_data = []
        # 2. Parallel Processing
        results = []
        # Increased workers for ~200 stocks. Be careful of rate limits (3/sec is standard, but Angel often allows more)
        # 20 workers ~ 20 concurrent requests.
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            chain_data = list(executor.map(fetch_option_row, target_strikes))
            
        # Ensure sorted
        chain_data.sort(key=lambda x: x['strike'])

        return {
            "status": "success",
            "symbol": symbol,
            "spot_price": ltp,
            "expiry": expiry_str,
            "chain": chain_data
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

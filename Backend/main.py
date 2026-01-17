from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from SmartApi import SmartConnect
import os
import json
import pyotp
import pandas as pd
import pandas_ta as ta # Ensure pandas_ta is available
from swing_strategy import SwingStrategy
from macd_strategy import MACDStrategy
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging
import threading
from SmartApi.smartWebSocketV2 import SmartWebSocketV2


# Local Imports
try:
    from .tokens import NIFTY_50_TOKENS
    from .scrip_master import ScripMaster
    from .broker.upstox import UpstoxBroker
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

@app.get("/upstox/test/{symbol}")
def test_upstox_data(symbol: str):
    """
    Test Upstox Historical Data Fetch
    """
    try:
        data = upstox_broker.get_historical_data(symbol, "1d")
        if data:
            return {"status": "success", "count": len(data), "latest": data[-1]}
        return {"status": "error", "message": "No Data or Instrument Key Not Found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

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

strategy_tracker = {} # Symbol -> { "LOM_SHORT": "HH:MM", ... }
try:
    if os.path.exists("strategy_tracker.json"):
        with open("strategy_tracker.json", "r") as f:
            strategy_tracker = json.load(f)
            print(f"Loaded Strategy Tracker: {len(strategy_tracker)} symbols")
except Exception as e:
    print(f"Failed to load strategy tracker: {e}")

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
                # print(f"WS Tick: {message['token']} -> {message['last_traded_price']}")
                tok = message['token']
                # Clean token (sometimes comes with quotes or extra chars?) - usually clean string
                
                # Find symbol
                if tok in token_map_reverse:
                    sym = token_map_reverse[tok]
                    if sym in market_cache:
                        new_ltp = message['last_traded_price'] / 100.0
                        market_cache[sym]['ltp'] = new_ltp
                        
                        # Real-Time Change Calculation
                        if 'prev_close' in market_cache[sym]:
                            pc = market_cache[sym]['prev_close']
                            if pc > 0:
                                change = ((new_ltp - pc) / pc) * 100
                                market_cache[sym]['change_pct'] = round(change, 2)
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
    
# --- METRICS CALCULATION (Global for Resume) ---
def calculate_metrics(symbol, token, hist_data, ath_val=0, time_finder_func=None):
    try:
        if len(hist_data) < 5: return None
        
        # Freshness Check (Don't process data older than 5 days)
        try:
            last_c_time = hist_data[-1][0]
            last_dt = None
            if "T" in last_c_time:
                last_dt = datetime.strptime(last_c_time.split("T")[0], "%Y-%m-%d")
            else:
                last_dt = datetime.strptime(last_c_time[:10], "%Y-%m-%d")
            
            if (datetime.now() - last_dt).days > 5:
                # print(f"Skipping {symbol}: Data too old ({last_dt.date()})")
                return None
        except: pass
        
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
        
        # --- Advanced Strength Score (0-100) ---
        # 1. Trend (40 pts)
        ema20 = s.ewm(span=20, adjust=False).mean().iloc[-1]
        ema50 = s.ewm(span=50, adjust=False).mean().iloc[-1]
        
        trend_score = 0
        if c0 > ema50: trend_score += 20
        if c0 > ema20: trend_score += 10
        # Higher Highs check (vs 10d high excluding today)
        h10_prev = max([x[2] for x in hist_data[-11:-1]]) if len(hist_data) >= 12 else c0
        if c0 > h10_prev: trend_score += 10
        
        # 2. Momentum (40 pts) - RSI & MACD
        mom_score = 0
        # RSI
        if 50 <= cur_rsi <= 70: mom_score += 20
        elif cur_rsi > 70: mom_score += 10 # Overbought but strong
        else: mom_score += 0 # Bearish
        
        # MACD
        if macd.iloc[-1] > sig.iloc[-1]: mom_score += 10
        if hist.iloc[-1] > 0 and hist.iloc[-1] > hist.iloc[-2]: mom_score += 10 # Growing Bullish
        
        # 3. Volume/Price Action (20 pts)
        vol_score = 0
        if dom_current == "Buyers": vol_score += 10
        
        # Avg Vol Check
        vols = [x[5] for x in hist_data] # Volume is index 5
        avg_vol_10 = sum(vols[-11:-1]) / 10 if len(vols) >= 11 else vols[-1]
        if vols[-1] > avg_vol_10: vol_score += 10
        
        score = trend_score + mom_score + vol_score
        
        sentiment = "Neutral"
        if score >= 80: sentiment = "STRONG BUY"
        elif score >= 60: sentiment = "Bullish"
        elif score <= 20: sentiment = "STRONG SELL"
        elif score <= 40: sentiment = "Bearish"

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
        h1, l1 = get_high_low(1) # 1-Day High/Low
        h2, l2 = get_high_low(2) # 2-Day High/Low
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
        bo_2 = check_breakout(h2, l2)
        bo_10 = check_breakout(h10, l10)
        bo_30 = check_breakout(h30, l30)
        bo_50 = check_breakout(h50, l50)
        bo_100 = check_breakout(h100, l100)
        bo_52w = check_breakout(h52w, l52w)
        
        bo_all = "Consolidating"
        # ATH Breakout: If Day High > PREVIOUS All Time High (and prev > 0)
        if prev_ath > 0 and day_h >= prev_ath:
            bo_all = "Bullish Breakout"

        # --- Advanced Strategy Logic ---
        # 1. LOM (Level of Momentum)
        lom_status = "None"
        
        # Bullish LOM (Price Action Focus for persistent component consistency)
        if 0.5 <= change_current <= 3.0:
            lom_status = "LOM_SHORT"
        elif change_current > 3.0:
            lom_status = "LOM_LONG"

        # Simple Price-Action LOM Bear (regardless of score for now, or maybe score < 40)
        if -3.0 <= change_current <= -0.5:
                if lom_status == "None": lom_status = "LOM_SHORT_BEAR"
        elif change_current < -3.0:
                if lom_status == "None": lom_status = "LOM_LONG_BEAR"

        # 2. Contraction (Tight Range with quality)
        is_contraction = False
        if abs(change_current) < 0.25 and score > 50:
            is_contraction = True
        
        # 3. Sniper (Oversold Reversal)
        is_sniper = False
        if change_current < -2.0 and cur_rsi < 40:
            is_sniper = True

        # Breakout Time Logic
        now = datetime.now()
        market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
        
        if now > market_close:
            scan_dt = market_close
        else:
            scan_dt = now
        
        final_dt = scan_dt
            
        current_time = final_dt.strftime("%H:%M:%S") # For Breakouts (Compact)
        current_full_time = final_dt.strftime("%Y-%m-%d %H:%M:%S") # For Strategies (Full)
        
        # Helper to find precise time if allowed
        def find_time(tf, status, level):
            # 1. Check Global Tracker first
            # NOTE: Global usage here might be tricky if thread-safety is concern or if running ad-hoc
            # For Ad-Hoc analysis we likely won't find it in global tracker unless it's tracked.
            existing = breakout_tracker.get(symbol, {}).get(tf)
            if existing: return existing
            
            # 2. If not existing, try to find it
            if time_finder_func and status in ["Bullish Breakout", "Bearish Breakout"]:
                try:
                        # Get date from the breakout candle (last daily candle)
                        last_candle_time = hist_data[-1][0] 
                        dt_obj = None
                        if 'T' in last_candle_time:
                            dt_obj = datetime.strptime(last_candle_time.split("T")[0], "%Y-%m-%d")
                        else:
                            dt_obj = datetime.strptime(last_candle_time[:10], "%Y-%m-%d")

                        is_bull = status == "Bullish Breakout"
                        found = time_finder_func(symbol, token, level, is_bull, date_obj=dt_obj)
                        if found: return found
                        
                        # Fallback to Candle Date + 15:30 if exact time not found but breakout exists
                        return dt_obj.strftime("%Y-%m-%d") + " 15:30:00"
                except:
                    pass
            
            # 3. Fallback (Use current scan time only if date parsing failed)
            return current_full_time

        new_breakouts = {}
        if bo_1 in ["Bullish Breakout", "Bearish Breakout"]: 
                new_breakouts["1d"] = find_time("1d", bo_1, h1 if bo_1=="Bullish Breakout" else l1) or current_full_time
        if bo_2 in ["Bullish Breakout", "Bearish Breakout"]: 
                new_breakouts["2d"] = find_time("2d", bo_2, h2 if bo_2=="Bullish Breakout" else l2) or current_full_time
        if bo_10 in ["Bullish Breakout", "Bearish Breakout"]: 
                new_breakouts["10d"] = find_time("10d", bo_10, h10 if bo_10=="Bullish Breakout" else l10) or current_full_time
        if bo_30 in ["Bullish Breakout", "Bearish Breakout"]: 
                new_breakouts["30d"] = find_time("30d", bo_30, h30 if bo_30=="Bullish Breakout" else l30) or current_full_time
        if bo_50 in ["Bullish Breakout", "Bearish Breakout"]: 
                new_breakouts["50d"] = find_time("50d", bo_50, h50 if bo_50=="Bullish Breakout" else l50) or current_full_time
        if bo_100 in ["Bullish Breakout", "Bearish Breakout"]: 
                new_breakouts["100d"] = find_time("100d", bo_100, h100 if bo_100=="Bullish Breakout" else l100) or current_full_time
        if bo_52w in ["Bullish Breakout", "Bearish Breakout"]: 
                new_breakouts["52w"] = find_time("52w", bo_52w, h52w if bo_52w=="Bullish Breakout" else l52w) or current_full_time
        # Find time against PREV ATH
        if bo_all == "Bullish Breakout": 
                new_breakouts["all"] = find_time("all", bo_all, prev_ath) or current_full_time
                
        # --- EXACT EVENT TIME LOGIC (LOM / Reversal) ---
        strategy_hits = {} # Local container to return to main thread
        
        # Calculate Prev Close to determine Trigger Levels
        # change_pct = ((c0 - prev)/prev)*100  =>  prev = c0 / (1 + change/100)
        try:
            prev_close = c0 / (1 + (change_current/100.0))
        except:
            prev_close = c0 # Fallback

        if lom_status == "LOM_SHORT":
            trig_lvl = prev_close * 1.005
            found_time = find_time("LOM_SHORT", "Bullish Breakout", trig_lvl)
            if found_time: strategy_hits["LOM_SHORT"] = found_time

        if lom_status == "LOM_LONG":
            trig_lvl = prev_close * 1.03
            found_time = find_time("LOM_LONG", "Bullish Breakout", trig_lvl)
            if found_time: strategy_hits["LOM_LONG"] = found_time

        if lom_status == "LOM_SHORT_BEAR":
            trig_lvl = prev_close * 0.995 # -0.5%
            found_time = find_time("LOM_SHORT_BEAR", "Bearish Breakout", trig_lvl)
            if found_time: strategy_hits["LOM_SHORT_BEAR"] = found_time

        if change_current < -2.0: # Reversal condition
                trig_lvl = prev_close * 0.98
                found_time = find_time("REVERSAL", "Bearish Breakout", trig_lvl)
                if found_time: strategy_hits["REVERSAL"] = found_time

        if is_contraction:
                strategy_hits["CONTRACTION"] = current_full_time
        
        if is_sniper:
                strategy_hits["SNIPER"] = current_full_time

        # We don't read/write global breakout_tracker here to ensure thread safety
        # Instead, we return detected breakouts to the main thread

        return {
            "scan_time": current_time,
            "scan_full_time": current_full_time, # For Strategies
            "breakout_times": new_breakouts, # Pass to main thread
            "strategy_hits": strategy_hits, # NEW: Pass precise strategy times
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
            "lom": lom_status,             # NEW
            "is_contraction": is_contraction, # NEW
            "is_sniper": is_sniper,        # NEW
            "breakout_1d": bo_1,
            "breakout_2d": bo_2,           # NEW
            "breakout_10d": bo_10,
            "breakout_30d": bo_30,
            "breakout_50d": bo_50,
            "breakout_100d": bo_100,
            "breakout_52w": bo_52w,
            "high_1d": h1, "low_1d": l1,
            "high_2d": h2, "low_2d": l2,   # NEW
            "high_10d": h10, "low_10d": l10,
            "high_30d": h30, "low_30d": l30,
            "high_50d": h50, "low_50d": l50,
            "high_100d": h100, "low_100d": l100,
            "high_52w": h52w, "low_52w": l52w,
            "breakout_all": bo_all,
            "high_all": new_ath,
            "day_high": day_h,
            "day_low": day_l,
            "volume": hist_data[-1][5],
            "turnover": (c0 * hist_data[-1][5]) / 10000000, # Turnover in Cr
            # Signal to main thread if we found a new ATH to save
            "update_ath": new_ath if new_ath > prev_ath else None,
            "prev_close": hist_data[-2][4] if len(hist_data) >= 2 else c0 # Return Prev Close for Live Calcs
        }
    except Exception as e:
        print(f"Metrics Error {symbol}: {e}")
        import traceback
        traceback.print_exc()
        return None

# --- PRE-MARKET ENDPOINT ---
@app.get("/api/pre-market")
def get_pre_market_data():
    try:
        data = list(market_cache.values())
        if not data: return {"status": "empty", "message": "No data available"}
        
        # Determine Market Status
        now = datetime.now()
        market_status = "CLOSED"
        if now.hour == 9 and 0 <= now.minute < 15:
            market_status = "PRE-OPEN"
        elif (now.hour == 9 and now.minute >= 15) or (now.hour > 9 and now.hour < 15) or (now.hour == 15 and now.minute <= 30):
             market_status = "OPEN"
        
        # 1. Pre-Market Gainers/Losers (Based on Last Close)
        # Sort by change_pct
        sorted_change = sorted(data, key=lambda x: x.get('change_pct', 0), reverse=True)
        top_gainers = sorted_change[:20]
        top_losers = sorted_change[-20:][::-1] # Ascending
        
        # 2. Breakout Watch (Near Levels)
        watch_list = []
        # Key levels to check
        levels_map = {
            "10d": "high_10d", "30d": "high_30d", "50d": "high_50d", 
            "100d": "high_100d", "52w": "high_52w", "all": "high_all"
        }
        
        for item in data:
            ltp = item.get('ltp', 0)
            if ltp == 0: continue
            
            # Check proximity to Resistance Levels (Bullish Watch)
            # We can also check Support for Bearish, but usually "Breakout" = Resistance
            closest_dist = 100
            closest_lvl = None
            closest_type = None
            
            for lbl, key in levels_map.items():
                lvl = item.get(key)
                if not lvl: continue
                
                # Check distance %
                # (Level - LTP) / LTP
                if lvl > ltp: # Approaching from below
                    dist = ((lvl - ltp) / ltp) * 100
                    if dist <= 0.5: # Within 0.5%
                        if dist < closest_dist:
                            closest_dist = dist
                            closest_lvl = lvl
                            closest_type = lbl
            
            if closest_type:
                watch_list.append({
                    "symbol": item['symbol'],
                    "ltp": ltp,
                    "breakout_type": closest_type,
                    "breakout_level": closest_lvl,
                    "distance_pct": round(closest_dist, 2),
                    "change_pct": item.get('change_pct', 0)
                })
        
        # Sort Watch List by distance (closest first)
        watch_list.sort(key=lambda x: x['distance_pct'])
        
        # 3. Strength Bias (3D Avg)
        # Group by Buyers/Sellers
        # Items with avg_3d > 0.5 -> Buyers, < -0.5 -> Sellers
        strength_buyers = [
            x for x in data if x.get('avg_3d', 0) > 0.5
        ]
        strength_sellers = [
            x for x in data if x.get('avg_3d', 0) < -0.5
        ]
        
        # Sort by strength magnitude
        strength_buyers.sort(key=lambda x: x.get('avg_3d', 0), reverse=True)
        strength_sellers.sort(key=lambda x: x.get('avg_3d', 0)) # Most negative first
        
        return {
            "gainers": top_gainers,
            "losers": top_losers,
            "breakout_watch": watch_list[:30], # Top 30 closest
            "strength_buyers": strength_buyers[:20],
            "strength_sellers": strength_sellers[:20],
            "market_status": market_status
        }
        
    except Exception as e:
        print(f"Pre-Market Error: {e}")
        return {"error": str(e)}

import time

# --- SWING STRATEGY ENDPOINT ---
@app.get("/strategies/swing")
def get_swing_stocks():
    try:
        # 1. Get List of Stocks to Scan
        scanner = ScripMaster.get_instance()
        fno_list = scanner.get_all_fno_tokens()
        
        if not fno_list:
            return {"status": "error", "message": "Scrip Master not ready"}
            
        results = []
        strategy = SwingStrategy()
        
        count = 0
        # LIMIT TO 30 STOCKS FOR DEMO/MVP TO AVOID TIMEOUT & RATE LIMITS
        max_stocks = 30
        
        for item in fno_list:
            if count >= max_stocks:
                break
                
            symbol = item['symbol']
            token = item['token']
            
            # Fetch Daily Data
            try:
                # Add delay to avoid Rate Limit (3 req/sec rule of thumb)
                time.sleep(0.4) 
                
                # Calculate from/to dates for last ~100 days
                to_date = datetime.now()
                from_date = to_date - timedelta(days=150)
                
                hist_params = {
                    "exchange": "NSE",
                    "symboltoken": token,
                    "interval": "ONE_DAY",
                    "fromdate": from_date.strftime("%Y-%m-%d %H:%M"),
                    "todate": to_date.strftime("%Y-%m-%d %H:%M")
                }
                
                data = smartApi.getCandleData(hist_params)
                
                if data['status'] and data['data']:
                    c_data = data['data']
                    df = pd.DataFrame(c_data, columns=['date', 'open', 'high', 'low', 'close', 'volume'])
                    
                    analysis = strategy.perform_analysis(df)
                    
                    if analysis:
                        res_obj = {
                            "symbol": symbol,
                            "token": token,
                            **analysis
                        }
                        results.append(res_obj)
                elif not data['status']:
                     print(f"Swing Scan Fail {symbol}: {data.get('message')}")
                        
            except Exception as e:
                print(f"Error scanning {symbol}: {e}")
                continue
                
            count += 1
            
        return {"status": "success", "count": len(results), "data": results}

    except Exception as e:
        print(f"Swing Strategy Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- MACD STRATEGY ENDPOINT ---
@app.get("/strategies/macd")
def get_macd_stocks():
    try:
        scanner = ScripMaster.get_instance()
        fno_list = scanner.get_all_fno_tokens()
        
        if not fno_list:
            return {"status": "error", "message": "Scrip Master not ready"}
            
        results = []
        strategy = MACDStrategy()
        
        # Scan ALL F&O stocks but in parallel
        scan_list = fno_list
        
        def process_macd(item):
            symbol = item['symbol']
            token = item['token']
            try:
                # Need last ~5 days
                to_date = datetime.now()
                from_date = to_date - timedelta(days=5)
                
                hist_params = {
                    "exchange": "NSE",
                    "symboltoken": token,
                    "interval": "FIVE_MINUTE",
                    "fromdate": from_date.strftime("%Y-%m-%d %H:%M"),
                    "todate": to_date.strftime("%Y-%m-%d %H:%M")
                }
                
                data = smartApi.getCandleData(hist_params)
                
                if data['status'] and data['data']:
                    c_data = data['data']
                    df = pd.DataFrame(c_data, columns=['date', 'open', 'high', 'low', 'close', 'volume'])
                    analysis = strategy.perform_analysis(df)
                    if analysis:
                        return { "symbol": symbol, "token": token, **analysis }
            except Exception as e:
                pass
            return None

        # ThreadPool 3 Workers
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_stock = {executor.submit(process_macd, item): item for item in scan_list}
            for future in as_completed(future_to_stock):
                res = future.result()
                if res:
                    results.append(res)
            
        # Sort results: Smallest Change First
        results.sort(key=lambda x: x['macd_change'])
        
        return {"status": "success", "count": len(results), "data": results}

    except Exception as e:
        print(f"MACD Strategy Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW API ENDPOINTS FOR SEARCH ---

@app.get("/search")
def search_stocks(q: str, exchange: str = "NSE"):
    try:
        sm = ScripMaster.get_instance()
        if not sm.df is not None:
            sm.load_data()
            
        df = sm.df
        q = q.upper()
        
        # Filter: NSE or BSE
        # Relaxed logic: Search in Name OR Symbol.
        # Removed strict '-EQ' check to allow SME (SM, ST) and other series (BE).
        mask = (df['exch_seg'] == exchange) & (
            (df['name'].str.contains(q, na=False)) | (df['symbol'].str.contains(q, na=False))
        )
        
        # For NSE, we might still want to prioritize EQ/BE over others if needed, but for now just show all.
        # Maybe exclude indices if they are in 'NSE' segment (usually they are in 'NSE-IND' or similar but here exch_seg is 'NSE')
        
        results = df[mask].head(20)[['name', 'token', 'symbol']].to_dict(orient='records')
        return {"status": "success", "data": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/analyze/{exchange}/{symbol}/{token}")
def analyze_stock(exchange: str, symbol: str, token: str):
    """
    On-Demand Analysis for any stock
    """
    try:
        # Check session
        if not session_data and not smartApi.access_token:
            login()
            
        # Fetch History
        to_date = datetime.now()
        from_date = to_date - timedelta(days=400) # Enough for year high/low
        fmt = "%Y-%m-%d %H:%M"
        
        res = smartApi.getCandleData({
            "exchange": exchange, "symboltoken": token, "interval": "ONE_DAY",
            "fromdate": from_date.strftime(fmt), "todate": to_date.strftime(fmt)
        })
        
        if res and res.get('data'):
             hist_data = res['data']
             # Calculate Metrics
             # Note: For on-demand, we might not have ATH cache, so ATH check is relative to loaded history (400 days)
             # or we could fetch deeper history (5000 days) if needed, but slow.
             # Let's stick to 400 days for speed (approx 1.5 year).
             # NOTE: calculate_metrics expects 'ath_val' to be from cache. We pass 0 if unknown.
             
             metrics = calculate_metrics(symbol, token, hist_data, ath_val=0) # No time finder for speed
             return {"status": "success", "data": metrics}
             
        else:
             return {"status": "error", "message": "No Data Found"}
             
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/news/{symbol}")
def get_stock_news(symbol: str):
    try:
        import requests
        import xml.etree.ElementTree as ET
        
        # Clean symbol (remove -EQ if present)
        clean_sym = symbol.replace("-EQ", "").replace("_EQ", "")
        
        # Google News RSS URL
        url = f"https://news.google.com/rss/search?q={clean_sym}+stock+news+india&hl=en-IN&gl=IN&ceid=IN:en"
        
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        
        news_items = []
        # Parse items
        for item in root.findall(".//item"):
            title = item.find("title").text if item.find("title") is not None else "No Title"
            link = item.find("link").text if item.find("link") is not None else "#"
            pubDate = item.find("pubDate").text if item.find("pubDate") is not None else ""
            source = item.find("source").text if item.find("source") is not None else "Google News"
            
            # Simple deduplication or cleaning if needed
            news_items.append({
                "title": title,
                "link": link,
                "date": pubDate,
                "source": source
            })
            
            if len(news_items) >= 5: break
            
        return {"status": "success", "data": news_items}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}



def background_scanner():
    global is_scanner_running, market_cache
    print("Scanner: Started")
    
            # Define Processing Logic Internal to Scanner (or move global)
    # calculate_metrics MOVED GLOBAL
    
    # --- CLEANUP STALE DATA (Start of Session) ---
    def clean_stale_data():
        global breakout_tracker, strategy_tracker
        today_str = datetime.now().strftime("%Y-%m-%d")
        print(f"Scanner: Cleaning stale data not matching {today_str}...")
        
        # 1. Clean Breakout Tracker
        cleaned_bo = 0
        for sym in list(breakout_tracker.keys()):
            # Copy to iterate safely
            entries = breakout_tracker[sym].copy()
            changed = False
            for tf, time_val in entries.items():
                # time_val can be "HH:MM" (Old/Stale) or "YYYY-MM-DD HH:MM:..." (New)
                is_stale = True
                
                # Check format
                if len(str(time_val)) > 10: # Likely has date
                    if str(time_val).startswith(today_str):
                        is_stale = False
                
                # If Stale, remove
                if is_stale:
                    del breakout_tracker[sym][tf]
                    changed = True
                    cleaned_bo += 1
            
            # Remove symbol if empty
            if not breakout_tracker[sym]:
                del breakout_tracker[sym]
                
        # 2. Clean Strategy Tracker
        cleaned_strat = 0
        for sym in list(strategy_tracker.keys()):
            entries = strategy_tracker[sym].copy()
            for strat, time_val in entries.items():
                is_stale = True
                if len(str(time_val)) > 10 and str(time_val).startswith(today_str):
                    is_stale = False
                
                if is_stale:
                    del strategy_tracker[sym][strat]
                    cleaned_strat += 1
            
            if not strategy_tracker[sym]:
                del strategy_tracker[sym]

        print(f"Scanner: Removed {cleaned_bo} stale breakouts and {cleaned_strat} stale strategies.")
        
        # Save immediately
        try:
            with open("breakout_tracker.json", "w") as f: json.dump(breakout_tracker, f)
            with open("strategy_tracker.json", "w") as f: json.dump(strategy_tracker, f)
        except: pass

    # Execute Cleanup Once
    clean_stale_data()

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
                
                # Helper to get Intraday Data for Precise Time (Rate Limited, Buffered)
                # Cache at function scope to avoid redundant calls for same stock
                intraday_candles_cache = None
                
                def get_intraday_breakout_time(symbol, token, level, is_bullish, date_obj=None):
                    nonlocal intraday_candles_cache
                    try:
                        # 1. Fetch if not cached
                        if intraday_candles_cache is None:
                            # Determine Date Range from passed date_obj or Now
                            if date_obj is None: target_date = datetime.now()
                            else: target_date = date_obj
                            
                            start_time = target_date.replace(hour=9, minute=15, second=0, microsecond=0)
                            end_time = target_date.replace(hour=15, minute=30, second=0, microsecond=0)
                            if target_date.date() == datetime.now().date() and datetime.now() < end_time:
                                 end_time = datetime.now()

                            start_str = start_time.strftime("%Y-%m-%d %H:%M")
                            end_str = end_time.strftime("%Y-%m-%d %H:%M")

                            print(f"DEBUG: Intraday Fetch {symbol} [Token:{token}] range {start_str} to {end_str}")
                            res = smartApi.getCandleData({
                                "exchange": "NSE", "symboltoken": token, "interval": "FIVE_MINUTE",
                                "fromdate": start_str, "todate": end_str
                            })
                            
                            if res and res.get('data'):
                                intraday_candles_cache = res['data']
                                print(f"DEBUG: Cached {len(intraday_candles_cache)} candles for {symbol}")
                            else:
                                intraday_candles_cache = [] # Empty list to prevent refetch
                                print(f"DEBUG: No Intraday Data for {symbol}")

                        # 2. Search in Cache
                        if not intraday_candles_cache: return None
                        
                        best_candidate_time = None
                        best_candidate_val = -1.0 if is_bullish else 999999.0
                        
                        for candle in intraday_candles_cache:
                            # Timestamp parse
                            try:
                                c_time_full = candle[0] # "2024-12-28T09:15:00+05:30"
                                c_time = c_time_full.split("T")[1][:5]
                            except: continue 
                            
                            c_open = candle[1]
                            c_high = candle[2]
                            c_low = candle[3]
                            
                            # Update Best Candidate (Highest High for Bull, Lowest Low for Bear)
                            # This is used as fallback if precise level isn't crossed (Data Mismatch)
                            if is_bullish:
                                if c_high > best_candidate_val:
                                    best_candidate_val = c_high
                                    best_candidate_time = c_time_full.replace("T", " ")[:16]
                            else:
                                if c_low < best_candidate_val:
                                    best_candidate_val = c_low
                                    best_candidate_time = c_time_full.replace("T", " ")[:16]

                            # Strict Check
                            if is_bullish:
                                if c_open >= level:
                                    print(f"DEBUG: {symbol} Bullish GAP UP > Level {level} @ {c_time} (Open:{c_open})")
                                    return c_time_full.replace("T", " ")[:16] 
                                if c_high >= level: 
                                    print(f"DEBUG: {symbol} Bullish CROSS > Level {level} @ {c_time} (High:{c_high})")
                                    return c_time_full.replace("T", " ")[:16]
                            else: # Bearish
                                if c_open <= level:
                                    print(f"DEBUG: {symbol} Bearish GAP DOWN < Level {level} @ {c_time}")
                                    return c_time_full.replace("T", " ")[:16] 
                                if c_low <= level: 
                                    print(f"DEBUG: {symbol} Bearish CROSS < Level {level} @ {c_time}")
                                    return c_time_full.replace("T", " ")[:16] 

                        # If we finish loop and found no strict cross, return the BEST CANDIDATE time
                        # This handles cases where Daily High > Level but Intraday High < Level (Data Discrepancy)
                        if best_candidate_time:
                            print(f"DEBUG: {symbol} Strict cross not found. Fallback to Best Time @ {best_candidate_time} (Val:{best_candidate_val})")
                            return best_candidate_time
                        
                        print(f"DEBUG: {symbol} Breakout detected but precise intraday time NOT found in cache.")
                        return None

                    except Exception as e:
                        print(f"Intraday Cache Error {symbol}: {e}")
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
                        new_bos = res.get('breakout_times', {})
                        
                        if sym not in breakout_tracker: breakout_tracker[sym] = {}
                        
                        for tf, time_str in new_bos.items():
                            # Only set if not already set (Keep the FIRST breakout time of the day/session)
                            if tf not in breakout_tracker[sym]:
                                breakout_tracker[sym][tf] = time_str
                                tracker_needs_save = True
                        
                        # Populate response with ALL persisted breakout times
                        res['breakout_times'] = breakout_tracker[sym]

                        # 1.1 Strategy Tracker
                        if sym not in strategy_tracker: strategy_tracker[sym] = {}
                        
                        # Check LOM
                        lom = res.get('lom')
                        if lom and lom != "None" and lom not in strategy_tracker[sym]:
                             strategy_tracker[sym][lom] = res['scan_full_time']
                             tracker_needs_save = True # Reuse same save flag or add new one? reused is fine if we save both
                        
                        # Support Bearish LOM tracking
                        if "LOM_SHORT_BEAR" in strategy_tracker[sym]: res['lom_short_bear_time'] = strategy_tracker[sym]["LOM_SHORT_BEAR"]
                        if "LOM_SHORT" in strategy_tracker[sym]: res['lom_short_time'] = strategy_tracker[sym]["LOM_SHORT"]
                        
                        # Check Contraction
                        if res.get('is_contraction') and "CONTRACTION" not in strategy_tracker[sym]:
                             strategy_tracker[sym]["CONTRACTION"] = res['scan_full_time']
                             tracker_needs_save = True

                        # Check Sniper
                        if res.get('is_sniper') and "SNIPER" not in strategy_tracker[sym]:
                             strategy_tracker[sym]["SNIPER"] = res['scan_full_time']
                             tracker_needs_save = True

                        # Check REVERSAL (Day H/L Reversal / Deep Red)
                        # Page definition: change_pct < -2
                        if res.get('change_pct') and res['change_pct'] < -2.0 and "REVERSAL" not in strategy_tracker[sym]:
                             strategy_tracker[sym]["REVERSAL"] = res['scan_full_time']
                             tracker_needs_save = True

                        res['strategy_times'] = strategy_tracker[sym]

                        # 2. Update Cache
                        market_cache[sym] = res
                        market_cache[sym] = res
                        token_map_reverse[res['token']] = sym
                        
                        # A. Precise Hits (from Intraday Scan in calculate_metrics)
                        hits = res.get('strategy_hits', {})
                        for s_name, s_time in hits.items():
                             # Overwrite if current is missing OR if current is a "Fallback" (contains space/date)
                             # Precise time is "HH:MM" (no space). Fallback is "YYYY-MM-DD HH:MM:SS".
                             curr_val = strategy_tracker.get(sym, {}).get(s_name)
                             if not curr_val or " " in str(curr_val):
                                  strategy_tracker[sym][s_name] = s_time
                                  tracker_needs_save = True

                        # 3. Update ATH Cache
                        if res.get('update_ath'):
                             new_val = res['update_ath']
                             if new_val > ath_cache.get(sym, 0):
                                 ath_cache[sym] = new_val
                                 ath_needs_save = True

            # Save Tracker if Changed (Breakout)
            if tracker_needs_save:
                try:
                    with open("breakout_tracker.json", "w") as f:
                        json.dump(breakout_tracker, f)
                    
                    with open("strategy_tracker.json", "w") as f:
                        json.dump(strategy_tracker, f)
                        
                    print("Persistence: Saved trackers")
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

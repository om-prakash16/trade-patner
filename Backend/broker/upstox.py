import requests
import os
import urllib.parse
from datetime import datetime, timedelta
import pandas as pd
import io
import gzip
import json

class UpstoxBroker:
    def __init__(self, api_key=None, api_secret=None, redirect_uri=None):
        self.api_key = api_key or os.getenv("UPSTOX_API_KEY")
        self.api_secret = api_secret or os.getenv("UPSTOX_API_SECRET")
        self.redirect_uri = redirect_uri or os.getenv("UPSTOX_REDIRECT_URI")
        self.base_url = "https://api.upstox.com/v2"
        self.access_token = os.getenv("UPSTOX_ACCESS_TOKEN")
        self.instruments = None
        
        # Check Local File if env is missing
        if not self.access_token:
             self.load_token()
             
        # Load instruments lazily or on init if needed
        # self.load_instruments() 

    def save_token(self):
        """Save access token to file."""
        try:
            with open("upstox_token.json", "w") as f:
                json.dump({"access_token": self.access_token, "timestamp": str(datetime.now())}, f)
        except Exception as e:
            print(f"Error saving Upstox token: {e}")

    def load_token(self):
        """Load access token from file."""
        try:
            if os.path.exists("upstox_token.json"):
                with open("upstox_token.json", "r") as f:
                    data = json.load(f)
                    self.access_token = data.get("access_token")
        except Exception as e:
            print(f"Error loading Upstox token: {e}")

    def get_login_url(self):
        """Generate the login URL for the user to authenticate."""
        print(f"DEBUG: Generating Upstox Login URL with Redirect URI: {self.redirect_uri}")
        params = {
            "response_type": "code",
            "client_id": self.api_key,
            "redirect_uri": self.redirect_uri,
            "state": "ngta_init"
        }
        query = urllib.parse.urlencode(params)
        return f"{self.base_url}/login/authorization/dialog?{query}"

    def generate_token(self, code):
        """Exchange auth code for access token."""
        url = f"{self.base_url}/login/authorization/token"
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        data = {
            "code": code,
            "client_id": self.api_key,
            "client_secret": self.api_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        }
        
        try:
            response = requests.post(url, headers=headers, data=data)
            resp_json = response.json()
            
            if "access_token" in resp_json:
                self.access_token = resp_json["access_token"]
                self.save_token() 
                print(f"Upstox Login Successful. Token: {self.access_token[:10]}...")
                return True
            else:
                print(f"Upstox Login Failed: {resp_json}")
                return False
        except Exception as e:
            print(f"Error generating Upstox token: {e}")
            return False

    def load_instruments(self):
        """Download and parse NSE Equity instruments."""
        if self.instruments is not None: return
        
        try:
            print("Upstox: Downloading Instrument Master...")
            # NSE Equity
            url = "https://assets.upstox.com/market-quote/instruments/exchange/NSE.csv.gz"
            response = requests.get(url)
            
            with gzip.open(io.BytesIO(response.content), 'rt') as f:
                df = pd.read_csv(f)
                
            # Filter for Equity
            self.instruments = df
            print(f"Upstox: Loaded {len(df)} instruments")
        except Exception as e:
            print(f"Upstox Instrument Load Failed: {e}")

    def get_instrument_key(self, symbol):
        """Find instrument key for a symbol (e.g., RELIANCE -> NSE_EQ|INE002A01018)."""
        if self.instruments is None:
            self.load_instruments()
            
        if self.instruments is None: return None
        
        # Search exact match
        # Usually symbols in master are 'RELIANCE', 'TCS' etc.
        # Check column names: usually 'tradingsymbol', 'instrument_key'
        res = self.instruments[self.instruments['tradingsymbol'] == symbol.upper()]
        if not res.empty:
            return res.iloc[0]['instrument_key']
        return None

    def get_historical_data(self, symbol, interval="1d", from_date=None, to_date=None):
        """
        Fetch historical candle data.
        Returns list of [timestamp, open, high, low, close, volume] matching Angel One.
        interval: '1d', '1minute', '30minute' etc.
        """
        if not self.access_token:
            print("Upstox: No Access Token")
            return None

        instrument_key = self.get_instrument_key(symbol)
        if not instrument_key:
            print(f"Upstox: Instrument key not found for {symbol}")
            return None
            
        # Format dates: YYYY-MM-DD
        if not to_date: to_date = datetime.now().strftime("%Y-%m-%d")
        if not from_date: from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        # Upstox Interval Mapping
        # day, 1minute, 30minute
        u_interval = "day" if interval == "1d" else interval
        
        url = f"{self.base_url}/historical-candle/{instrument_key}/{u_interval}/{to_date}/{from_date}"
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
        
        try:
            response = requests.get(url, headers=headers)
            data = response.json()
            
            if data.get("status") == "success" and data.get("data") and data.get("data").get("candles"):
                # Upstox format: [timestamp, open, high, low, close, volume, open_interest]
                # Angel format: [timestamp, open, high, low, close, volume]
                # We just need to slice or ensure format.
                
                candles = data["data"]["candles"]
                # Sort by time asc (Upstox returns desc usually)
                candles.sort(key=lambda x: x[0])
                
                cleaned = []
                for c in candles:
                    # c[0] is '2024-12-28T00:00:00+05:30'
                    cleaned.append([c[0], c[1], c[2], c[3], c[4], c[5]])
                    
                return cleaned
            else:
                print(f"Upstox History Error: {data}")
                return None
        except Exception as e:
            print(f"Upstox API Error: {e}")
            return None

    def get_access_token(self):
        return self.access_token

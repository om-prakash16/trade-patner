import requests
import os
import urllib.parse
from datetime import datetime

import json

class UpstoxBroker:
    def __init__(self, api_key=None, api_secret=None, redirect_uri=None):
        self.api_key = api_key or os.getenv("UPSTOX_API_KEY")
        self.api_secret = api_secret or os.getenv("UPSTOX_API_SECRET")
        self.redirect_uri = redirect_uri or os.getenv("UPSTOX_REDIRECT_URI")
        self.base_url = "https://api.upstox.com/v2"
        self.access_token = os.getenv("UPSTOX_ACCESS_TOKEN") # Check Env first
        
        # Check Local File if env is missing
        if not self.access_token:
             self.load_token()

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
                self.save_token() # Persist
                print(f"Upstox Login Successful. Token: {self.access_token[:10]}...")
                return True
            else:
                print(f"Upstox Login Failed: {resp_json}")
                return False
        except Exception as e:
            print(f"Error generating Upstox token: {e}")
            return False

    def get_market_quote(self, symbol_list, exchange="NSE_EQ"):
        """
        Fetch market quotes for a list of symbols.
        """
        if not self.access_token:
            print("Upstox: No Access Token")
            return None
        return {}

    def get_historical_data(self, symbol, interval, from_date, to_date):
        """
        Fetch historical candle data (OHLC).
        Returns list of [timestamp, open, high, low, close, volume] to match Angel One format.
        """
        if not self.access_token:
            print("Upstox: No Access Token")
            return None
            
        # Example URL for Upstox Historical Data (needs Instrument Key)
        # url = f"{self.base_url}/historical-candle/{instrument_key}/{interval}/{to_date}/{from_date}"
        
        # Placeholder: Real implementation requires Instrument Key mapping.
        # Returning None for now until keys are mapped.
        print(f"Upstox: Fetching history for {symbol} (Placeholder)")
        return None

    def get_access_token(self):
        return self.access_token

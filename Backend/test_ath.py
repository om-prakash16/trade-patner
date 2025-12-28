from SmartApi import SmartConnect
import os
from dotenv import load_dotenv, find_dotenv
import pyotp
from datetime import datetime, timedelta
import pandas as pd
import sys

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

with open("debug_output.txt", "w") as f:
    f.write("Script Start\n")

print("Starting Test Script...", flush=True)

try:
    path = find_dotenv(usecwd=True)
    with open("debug_output.txt", "a") as f:
         f.write(f"Loading .env from: {path}\n")
    print(f"Loading .env from: {path}", flush=True)
    load_dotenv(path)
except Exception as e:
    print(f"Dotenv Error: {e}", flush=True)

api_key = os.getenv("ANGEL_API_KEY")
client_code = os.getenv("ANGEL_CLIENT_CODE")
password = os.getenv("ANGEL_PASSWORD")
totp_secret = os.getenv("ANGEL_TOTP_SECRET")

print(f"Credentials present: All={all([api_key, client_code, password, totp_secret])}")

smartApi = SmartConnect(api_key=api_key)
try:
    totp = pyotp.TOTP(totp_secret).now()
    data = smartApi.generateSession(client_code, password, totp)
    if data['status']:
        print("Login Successful")
    else:
        print("Login Failed:", data['message'])
        exit()
except Exception as e:
    print("Login Error:", e)
    exit()

# Try fetching 15 years of data for RELIANCE (Token 2885) or SBIN (3045)
# RELIANCE token: 2885
token = "2885" 
symbol = "RELIANCE-EQ"

to_date = datetime.now()
from_date = to_date - timedelta(days=5000) # ~13.7 years
fmt = "%Y-%m-%d %H:%M"

print(f"Fetching data from {from_date.strftime(fmt)} to {to_date.strftime(fmt)}")

try:
    res = smartApi.getCandleData({
        "exchange": "NSE", 
        "symboltoken": token, 
        "interval": "ONE_DAY",
        "fromdate": from_date.strftime(fmt), 
        "todate": to_date.strftime(fmt)
    })
    
    if res and res.get('data'):
        df = pd.DataFrame(res['data'], columns=["timestamp", "open", "high", "low", "close", "volume"])
        print(f"Success! Fetched {len(df)} candles.")
        print(f"First Date: {df.iloc[0]['timestamp']}")
        print(f"Last Date: {df.iloc[-1]['timestamp']}")
        
        # Calculate ATH
        ath = df['high'].max()
        print(f"Calculated ATH: {ath}")
    else:
        print("No data returned", res)
        
except Exception as e:
    print("Fetch Error:", e)

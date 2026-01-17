import pandas as pd
import pandas_ta as ta
import logging
from datetime import datetime, time, timedelta

class MACDStrategy:
    def __init__(self):
        self.logger = logging.getLogger("MACDStrategy")
        # Time Window Constants
        self.START_TIME = time(12, 0)
        self.END_TIME = time(14, 25)

    def perform_analysis(self, df: pd.DataFrame) -> dict:
        """
        Analyzes a single stock dataframe (5-Minute Timeframe) for MACD squeeze/buildup.
        df requires: 'date' (datetime), 'close'
        """
        if df.empty or len(df) < 50:
            return None

        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        
        # 1. Calculate MACD (12, 26, 9) on ENTIRE dataframe first for accuracy
        macd = ta.macd(df['close'], fast=12, slow=26, signal=9)
        # Handle cases where MACD calculation fails (e.g. not enough data)
        if macd is None or macd.empty:
            return None
            
        df['MACD'] = macd['MACD_12_26_9']
        df['MACD_SIGNAL'] = macd['MACDs_12_26_9']
        df['MACD_HIST'] = macd['MACDh_12_26_9']

        # 2. Identify "Today" vs "Yesterday" (Trading Days)
        # Get unique dates sorted
        unique_dates = df['date'].dt.date.unique()
        unique_dates.sort() # Ensure sorted
        
        if len(unique_dates) < 2:
            return None # Need at least 2 days of data
            
        # Determine strict "Today" (or last available day) and "Yesterday" (day before last)
        today_date = unique_dates[-1]
        yesterday_date = unique_dates[-2]
        
        # 3. Analyze "Today" Window (12:00 - 14:25)
        # Filter for today AND time window
        mask_today = (df['date'].dt.date == today_date) & \
                     (df['date'].dt.time >= self.START_TIME) & \
                     (df['date'].dt.time <= self.END_TIME)
                     
        today_df = df[mask_today]
        
        if today_df.empty:
             return None

        # Get Start and End values for Today
        # Start: Closest to 12:00 (First row of window)
        # End: Current or 14:25 (Last row of window)
        
        start_row = today_df.iloc[0]
        end_row = today_df.iloc[-1]
        
        macd_start = start_row['MACD']
        macd_end = end_row['MACD']
        
        macd_change = abs(macd_end - macd_start)
        
        # Rule: Change must be <= 3.0 (Relaxed for visibility)
        if macd_change > 3.0:
            return None # Filter out
            
        # 4. Analyze "Yesterday" Window (Comparison)
        mask_yest = (df['date'].dt.date == yesterday_date) & \
                    (df['date'].dt.time >= self.START_TIME) & \
                    (df['date'].dt.time <= self.END_TIME)
        yest_df = df[mask_yest]
        
        yest_macd_change = 0.0
        if not yest_df.empty:
             y_start = yest_df.iloc[0]['MACD']
             y_end = yest_df.iloc[-1]['MACD']
             yest_macd_change = abs(y_end - y_start)
             
        # 5. Determine State
        # Direction
        direction = "Flat"
        if macd_end > macd_start + 0.1: direction = "Bullish"
        elif macd_end < macd_start - 0.1: direction = "Bearish"
        
        # Status Comparison
        # If today's movement is similar to yesterday's (stable volatility)
        status = "Stable"
        if macd_change > yest_macd_change * 1.5: status = "Increasing" # Volatility expansion?
        elif macd_change < yest_macd_change * 0.5: status = "Decreasing" # Contraction
        
        return {
            "date": today_date.strftime("%Y-%m-%d"),
            "macd_start": round(macd_start, 2),
            "macd_end": round(macd_end, 2),
            "macd_change": round(macd_change, 3), # 3 decimals for precision
            "yest_change": round(yest_macd_change, 3),
            "direction": direction,
            "status": status,
            "ltp": end_row['close']
        }

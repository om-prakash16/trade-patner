import pandas as pd
import pandas_ta as ta
import logging
from datetime import datetime, time, timedelta

class BearishMACDStrategy:
    def __init__(self):
        self.logger = logging.getLogger("BearishMACDStrategy")
        # Custom Time Window for Bearish Setups
        self.START_TIME = time(10, 10)
        self.END_TIME = time(14, 10)

    def perform_analysis(self, df: pd.DataFrame) -> dict:
        """
        Analyzes a single stock dataframe (5-Minute Timeframe) for Bearish MACD setups.
        Criteria:
        - Time: 10:10 to 14:10
        - Direction: Bearish (Start > End)
        - Change: Between -0.01 and -0.2 (i.e. abs change 0.01 to 0.2)
        """
        if df.empty or len(df) < 50:
            return None

        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        
        # 1. Calculate MACD (12, 26, 9)
        macd = ta.macd(df['close'], fast=12, slow=26, signal=9)
        if macd is None or macd.empty:
            return None
            
        df['MACD'] = macd['MACD_12_26_9']

        # 2. Identify "Today" vs "Yesterday"
        unique_dates = df['date'].dt.date.unique()
        unique_dates.sort()
        
        if len(unique_dates) < 2: return None
            
        today_date = unique_dates[-1]
        yesterday_date = unique_dates[-2]
        
        # 3. Analyze "Today" Window (10:10 - 14:10)
        mask_today = (df['date'].dt.date == today_date) & \
                     (df['date'].dt.time >= self.START_TIME) & \
                     (df['date'].dt.time <= self.END_TIME)
                     
        today_df = df[mask_today]
        if today_df.empty: return None

        # Start and End values
        start_row = today_df.iloc[0]
        end_row = today_df.iloc[-1]
        
        macd_start = start_row['MACD']
        macd_end = end_row['MACD']
        
        # Actual Change (can be negative)
        raw_change = macd_end - macd_start
        abs_change = abs(raw_change)
        
        # FILTER CRITERIA:
        # 1. Must be Bearish (Negative Change)
        # 2. Range: -0.01 to -0.2 (meaning raw_change is between -0.2 and -0.01)
        if not (-0.2 <= raw_change <= -0.01):
            return None
            
        # 4. Analyze "Yesterday" Window (Comparison) - same time window
        mask_yest = (df['date'].dt.date == yesterday_date) & \
                    (df['date'].dt.time >= self.START_TIME) & \
                    (df['date'].dt.time <= self.END_TIME)
        yest_df = df[mask_yest]
        
        yest_raw_change = 0.0
        if not yest_df.empty:
             y_start = yest_df.iloc[0]['MACD']
             y_end = yest_df.iloc[-1]['MACD']
             yest_raw_change = y_end - y_start
             
        # status
        direction = "Bearish"
        
        return {
            "date": today_date.strftime("%Y-%m-%d"),
            "macd_start": round(macd_start, 2),
            "macd_end": round(macd_end, 2),
            "macd_change": round(raw_change, 3), # Return Signed Change
            "yest_change": round(yest_raw_change, 3),
            "direction": direction,
            "ltp": end_row['close']
        }

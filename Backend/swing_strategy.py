import pandas as pd
import pandas_ta as ta
import logging

class SwingStrategy:
    def __init__(self):
        self.logger = logging.getLogger("SwingStrategy")

    def perform_analysis(self, df: pd.DataFrame) -> dict:
        """
        Analyzes a single stock dataframe (Daily Timeframe) for Swing setups.
        df requires: 'open', 'high', 'low', 'close', 'volume', 'date' (or index as date)
        """
        if df.empty or len(df) < 55: # Need enough data for 50 DMA
            return None

        # Clean and Prepare
        df = df.copy()
        df['close'] = df['close'].astype(float)
        
        # Calculate Indicators
        # 1. Moving Averages
        df['SMA_20'] = ta.sma(df['close'], length=20)
        df['SMA_50'] = ta.sma(df['close'], length=50)
        
        # 2. RSI
        df['RSI'] = ta.rsi(df['close'], length=14)
        
        # 3. MACD
        macd = ta.macd(df['close'])
        df['MACD'] = macd['MACD_12_26_9']
        df['MACD_SIGNAL'] = macd['MACDs_12_26_9']
        df['MACD_HIST'] = macd['MACDh_12_26_9']
        
        # 4. Momentum (N-Day Returns)
        df['3D_Pct'] = df['close'].pct_change(periods=3) * 100
        df['5D_Pct'] = df['close'].pct_change(periods=5) * 100
        df['10D_Pct'] = df['close'].pct_change(periods=10) * 100
        
        # Current Candle (Latest)
        curr = df.iloc[-1]
        
        # --- LOGIC ---
        
        # 1. Trend Direction
        trend = "Sideways"
        if curr['close'] > curr['SMA_20'] and curr['close'] > curr['SMA_50']:
            # Ideally SMA20 > SMA50 for strong uptrend, but basic version requested:
            trend = "Uptrend"
        elif curr['close'] < curr['SMA_20'] and curr['close'] < curr['SMA_50']:
            trend = "Downtrend"
            
        # 2. Swing Momentum
        # Simple weighted score of recent moves
        # Weights: 3D (50%), 5D (30%), 10D (20%) - favoring recent action
        avg_3d = curr['3D_Pct'] if not pd.isna(curr['3D_Pct']) else 0
        avg_5d = curr['5D_Pct'] if not pd.isna(curr['5D_Pct']) else 0
        avg_10d = curr['10D_Pct'] if not pd.isna(curr['10D_Pct']) else 0
        
        momentum_score = (avg_3d * 0.5) + (avg_5d * 0.3) + (avg_10d * 0.2)
        
        # 3. Swing Bias
        bias = "Neutral"
        if trend == "Uptrend" and momentum_score > 0:
            bias = "Bullish"
        elif trend == "Downtrend" and momentum_score < 0:
            bias = "Bearish"
        elif trend == "Uptrend" and momentum_score < -2: # Pullback opportunity?
            bias = "Pullback (Buy?)"
        elif trend == "Downtrend" and momentum_score > 2:
            bias = "Relief Rally (Sell?)"

        # 4. Support / Resistance (Basic Pivot or recent High/Low)
        # Using simple 20-day High/Low as proxy for now
        recent_high = df['high'].iloc[-20:].max()
        recent_low = df['low'].iloc[-20:].min()
        
        # 5. Indicators Status
        rsi_val = curr['RSI']
        macd_val = curr['MACD']
        macd_sig = curr['MACD_SIGNAL']
        
        indicator_status = []
        if rsi_val > 70: indicator_status.append("RSI OB")
        elif rsi_val < 30: indicator_status.append("RSI OS")
        
        if macd_val > macd_sig: indicator_status.append("MACD Bull")
        else: indicator_status.append("MACD Bear")

        return {
            "ltp": curr['close'],
            "trend": trend,
            "bias": bias,
            "avg_3d": round(avg_3d, 2),
            "avg_5d": round(avg_5d, 2),
            "avg_10d": round(avg_10d, 2),
            "momentum_score": round(momentum_score, 2),
            "support": float(recent_low),
            "resistance": float(recent_high),
            "rsi": round(rsi_val, 2),
            "macd_hist": round(curr['MACD_HIST'], 2),
            "indicators": indicator_status
        }

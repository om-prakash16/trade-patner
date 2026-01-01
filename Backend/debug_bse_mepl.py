
from scrip_master import ScripMaster
import pandas as pd

sm = ScripMaster.get_instance()
sm.load_data()
df = sm.df

print("Searching BSE for 'MEPL' or 'MANGALAM'...")
bse_df = df[df['exch_seg'] == 'BSE']

# Search for MEPL in symbol
m1 = bse_df[bse_df['symbol'].str.contains("MEPL", na=False)]
print(f"\nMatches for 'MEPL' in Symbol ({len(m1)}):")
if not m1.empty:
    print(m1[['name', 'symbol', 'token']].to_string())

# Search for MANGALAM in Name
m2 = bse_df[bse_df['name'].str.contains("MANGALAM", na=False)]
print(f"\nMatches for 'MANGALAM' in Name (Top 10):")
if not m2.empty:
     # Prioritize ones that might be MEPL
    print(m2[['name', 'symbol', 'token']].head(20).to_string())

# Check for token 532637 (seen in previous truncated output)
print(f"\nChecking Token 532637:")
t = bse_df[bse_df['token'] == '532637']
if not t.empty:
    print(t[['name', 'symbol', 'token']].to_string())

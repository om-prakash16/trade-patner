
from scrip_master import ScripMaster
import pandas as pd

sm = ScripMaster.get_instance()
sm.load_data()
df = sm.df

term = "MEPL"
mask = df['symbol'].str.contains(term, na=False)
matches = df[mask]

print(f"Found {len(matches)} matches for '{term}' in SYMBOL:")
if not matches.empty:
    print(matches[['exch_seg','name', 'symbol', 'token']].to_string())

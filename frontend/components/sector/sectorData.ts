export const SECTOR_MAPPING: Record<string, string> = {
    // BANKS (PVT & PSU)
    "HDFCBANK": "BANK",
    "ICICIBANK": "BANK",
    "KOTAKBANK": "BANK",
    "AXISBANK": "BANK",
    "SBIN": "PSU BANK",
    "INDUSINDBK": "BANK",
    "BANKBARODA": "PSU BANK",
    "PNB": "PSU BANK",
    "CANBK": "PSU BANK",
    "UNIONBANK": "PSU BANK",
    "IDFCFIRSTB": "BANK",
    "AUBANK": "BANK",
    "BANDHANBNK": "BANK",
    "FEDERALBNK": "BANK",

    // IT
    "TCS": "IT",
    "INFY": "IT",
    "HCLTECH": "IT",
    "WIPRO": "IT",
    "TECHM": "IT",
    "LTIM": "IT",
    "LTTS": "IT",
    "PERSISTENT": "IT",
    "COFORGE": "IT",
    "MPHASIS": "IT",

    // AUTO
    "MARUTI": "AUTO",
    "M&M": "AUTO",
    "TATAMOTORS": "AUTO",
    "BAJAJ-AUTO": "AUTO",
    "EICHERMOT": "AUTO",
    "HEROMOTOCO": "AUTO",
    "TVSMOTOR": "AUTO",
    "ASHOKLEY": "AUTO",
    "BHARATFORG": "AUTO",
    "MOTHERSON": "AUTO",

    // OIL & GAS / ENERGY
    "RELIANCE": "ENERGY",
    "ONGC": "ENERGY",
    "BPCL": "ENERGY",
    "IOC": "ENERGY",
    "POWERGRID": "ENERGY",
    "NTPC": "ENERGY",
    "COALINDIA": "ENERGY",
    "TATAPOWER": "ENERGY",
    "ADANIGREEN": "ENERGY",
    "ADANIPORTS": "INFRA", // Often grouped with Infra/Energy
    "GAIL": "ENERGY",

    // FMCG
    "ITC": "FMCG",
    "HINDUNILVR": "FMCG",
    "NESTLEIND": "FMCG",
    "BRITANNIA": "FMCG",
    "TATACONSUM": "FMCG",
    "DABUR": "FMCG",
    "MARICO": "FMCG",
    "COLPAL": "FMCG",
    "GODREJCP": "FMCG",

    // METALS
    "TATASTEEL": "METAL",
    "JSWSTEEL": "METAL",
    "HINDALCO": "METAL",
    "VEDL": "METAL",
    "JINDALSTEL": "METAL",
    "SAIL": "METAL",
    "NMDC": "METAL",

    // PHARMA
    "SUNPHARMA": "PHARMA",
    "DRREDDY": "PHARMA",
    "CIPLA": "PHARMA",
    "DIVISLAB": "PHARMA",
    "APOLLOHOSP": "PHARMA",
    "LUPIN": "PHARMA",
    "AUROPHARMA": "PHARMA",
    "ALKEM": "PHARMA",

    // REALTY
    "DLF": "REALTY",
    "GODREJPROP": "REALTY",
    "LODHA": "REALTY",
    "PHOENIXLTD": "REALTY",
    "OBEROIRLTY": "REALTY",

    // CONSUMER DURABLES / OTHERS
    "TITAN": "CONSUMER",
    "ASIANPAINT": "CONSUMER",
    "BERGEPAINT": "CONSUMER",
    "HAVELLS": "CONSUMER",
    "VOLTAS": "CONSUMER",

    // TELECOM
    "BHARTIARTL": "TELECOM",
    "IDEA": "TELECOM",
    "INDUS-TOW": "TELECOM",

    // CEMENT
    "ULTRACEMCO": "CEMENT",
    "GRASIM": "CEMENT",
    "AMBUJACEM": "CEMENT",
    "ACC": "CEMENT",
    "DALBHARAT": "CEMENT",
    "SHREECEM": "CEMENT",

    // FINANCE (NBFC)
    "BAJFINANCE": "FINANCE",
    "BAJAJFINSV": "FINANCE",
    "CHOLAFIN": "FINANCE",
    "M&MFIN": "FINANCE",
    "SRTRANSFIN": "FINANCE",
    "MUTHOOTFIN": "FINANCE",
    "PFC": "FINANCE",
    "RECLTD": "FINANCE",
    "HDFCLIFE": "FINANCE",
    "SBILIFE": "FINANCE",

    // CHEMICALS
    "PIIND": "CHEMICALS",
    "UPL": "CHEMICALS",
    "SRF": "CHEMICALS",
    "NAVINFLUOR": "CHEMICALS",
    "AARTIIND": "CHEMICALS",

    // ADANI GROUP
    "ADANIENT": "METALS",
    "ADANIPOWER": "ENERGY",
    "ATGL": "ENERGY",
};

export const getSector = (symbol: string): string => {
    if (SECTOR_MAPPING[symbol]) return SECTOR_MAPPING[symbol];
    if (symbol.endsWith("BANK")) return "BANK";
    if (symbol.includes("CEMENT")) return "CEMENT";
    return "OTHERS";
}

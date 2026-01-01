export interface StockData {
    token: string;
    symbol: string;
    ltp: number;
    change_pct: number;
    strength_score: number;
    scan_time?: string;
    breakout_times?: Record<string, string>;
    day_high: number;
    day_low: number;
    volume: number;
    turnover: number;
    // Breakout Specifics
    breakout_1d?: string;
    breakout_2d?: string;
    high_1d?: number;
    low_1d?: number;
    high_2d?: number;
    low_2d?: number;
    [key: string]: any;
}

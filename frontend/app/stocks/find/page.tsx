"use client";

import { useMarketData } from "@/hooks/useMarketData";
import { useState, useMemo, useEffect } from "react";
import { Search, TrendingUp, TrendingDown, Clock, Activity, BarChart2, Zap } from "lucide-react";

export default function FindStockPage() {
    const { data } = useMarketData();
    const [searchQuery, setSearchQuery] = useState("");
    const [scope, setScope] = useState<"TRACKED" | "NSE" | "BSE">("TRACKED");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [analyzedStock, setAnalyzedStock] = useState<any | null>(null);
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [loadingNews, setLoadingNews] = useState(false);

    // Debounce Search for API
    useEffect(() => {
        if (scope === "TRACKED") return;

        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length < 3) {
                setSearchResults([]);
                return;
            };

            try {
                setLoading(true);
                const res = await fetch(`http://localhost:8000/search?q=${searchQuery}&exchange=${scope}`);
                const json = await res.json();
                if (json.status === "success") {
                    setSearchResults(json.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, scope]);

    // Tracked Filter
    const trackedResults = useMemo(() => {
        if (scope !== "TRACKED") return [];
        if (!searchQuery) return [];
        return data.filter(s =>
            s.symbol.toUpperCase().includes(searchQuery.toUpperCase())
        ).slice(0, 10);
    }, [data, searchQuery, scope]);

    // Unified List
    const displayList = scope === "TRACKED" ? trackedResults : searchResults;

    // Get selected stock data
    const stock = analyzedStock;

    const fetchNews = async (symbol: string) => {
        setLoadingNews(true);
        setNews([]);
        try {
            const res = await fetch(`http://localhost:8000/news/${symbol}`);
            const json = await res.json();
            if (json.status === "success") {
                setNews(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingNews(false);
        }
    }

    const handleSelect = async (item: any) => {
        setSearchQuery("");
        setSearchResults([]);

        if (scope === "TRACKED") {
            setAnalyzedStock(item);
            // Fetch News for Tracked
            fetchNews(item.symbol);
        } else {
            // Need to Analyze
            try {
                setAnalyzing(true);
                setAnalyzedStock(null);
                const res = await fetch(`http://localhost:8000/analyze/${scope}/${item.symbol}/${item.token}`);
                const json = await res.json();
                if (json.status === "success") {
                    setAnalyzedStock(json.data);
                    fetchNews(item.symbol);
                } else {
                    alert("Analysis Failed: " + json.message);
                }
            } catch (err) {
                alert("Analysis Error");
            } finally {
                setAnalyzing(false);
            }
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen bg-black text-white">
            {/* Header / Search Area */}
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end gap-6 justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">
                        <span className="text-blue-500">Find</span> Your Stock
                    </h1>
                    <p className="text-slate-400">Deep dive into technicals, breakouts, and real-time strength.</p>
                </div>

                {/* Search Box */}
                <div className="relative w-full md:w-[400px] z-20 flex flex-col gap-2">
                    {/* Scope Selector */}
                    <div className="flex bg-slate-900 p-1 rounded-lg self-end border border-slate-800">
                        {(["TRACKED", "NSE", "BSE"] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => { setScope(s); setSearchQuery(""); }}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${scope === s ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                    }`}
                            >
                                {s === "TRACKED" ? "FAST (TRACKED)" : `ALL ${s}`}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder={scope === "TRACKED" ? "Search Tracked Stocks..." : `Search All ${scope}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none transition-all shadow-lg"
                        />
                        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {searchQuery && displayList.length > 0 && (
                        <div className="absolute top-[100px] left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50">
                            {displayList.map((s: any) => (
                                <button
                                    key={s.token}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-0 flex justify-between items-center group"
                                    onClick={() => handleSelect(s)}
                                >
                                    <span className="font-bold text-slate-300 group-hover:text-white">{s.symbol || s.name}</span>
                                    {/* Only show price if available (Tracked) */}
                                    {s.ltp && (
                                        <span className={`font-mono text-xs ${s.change_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {s.ltp.toFixed(2)} ({s.change_pct > 0 ? "+" : ""}{s.change_pct.toFixed(2)}%)
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {analyzing && !stock && (
                <div className="max-w-6xl mx-auto h-[400px] flex flex-col items-center justify-center animate-in fade-in">
                    <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                    <h3 className="text-xl font-bold text-slate-300 animate-pulse">Analyzing Market Data...</h3>
                    <p className="text-slate-500 mt-2">Fetching candles, calculating breakouts, & scoring strength.</p>
                </div>
            )}

            {/* Content Area */}
            {stock && !analyzing ? (
                <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

                    {/* 1. Hero Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[100px] rounded-full"></div>

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-1">{stock.symbol}</h2>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400">{stock.token}</span>
                                    <span className={`flex items-center gap-1 font-bold ${stock.change_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {stock.change_pct >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {stock.change_pct > 0 ? "+" : ""}{stock.change_pct.toFixed(2)}%
                                    </span>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-white">
                                    ₹{stock.ltp.toFixed(2)}
                                </div>
                                <div className="text-sm text-slate-400 font-mono mt-1">
                                    Vol: {(stock.volume / 10000000).toFixed(2)} Cr
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card title="RSI (14)" value={stock.rsi} colorClass={stock.rsi > 70 ? "text-red-400" : stock.rsi < 30 ? "text-emerald-400" : "text-blue-400"} />
                        <Card title="Strength Score" value={`${stock.strength_score}/100`} colorClass={stock.strength_score > 70 ? "text-emerald-400" : "text-slate-300"} />
                        <Card title="MACD Signal" value={stock.macd_signal} sub="Trend Indicator" />
                        <Card title="Sentiment" value={stock.sentiment} colorClass={stock.sentiment.includes("BUY") ? "text-emerald-400" : stock.sentiment.includes("SELL") ? "text-red-400" : "text-yellow-400"} />
                    </div>

                    {/* 3. Breakout Beacon Grid */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Breakout Beacon
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <BreakoutCard
                                title="Today (1D)"
                                status={stock.breakout_1d}
                                high={stock.high_1d}
                                low={stock.low_1d}
                                time={stock.breakout_times?.["1d"] || stock.scan_time}
                            />
                            <BreakoutCard
                                title="10 Days"
                                status={stock.breakout_10d}
                                high={stock.high_10d}
                                low={stock.low_10d}
                                time={stock.breakout_times?.["10d"] || stock.scan_time}
                            />
                            <BreakoutCard
                                title="30 Days"
                                status={stock.breakout_30d}
                                high={stock.high_30d}
                                low={stock.low_30d}
                                time={stock.breakout_times?.["30d"] || stock.scan_time}
                            />
                            <BreakoutCard
                                title="50 Days"
                                status={stock.breakout_50d}
                                high={stock.high_50d}
                                low={stock.low_50d}
                                time={stock.breakout_times?.["50d"] || stock.scan_time}
                            />
                            <BreakoutCard
                                title="100 Days"
                                status={stock.breakout_100d}
                                high={stock.high_100d}
                                low={stock.low_100d}
                                time={stock.breakout_times?.["100d"] || stock.scan_time}
                            />
                            <BreakoutCard
                                title="52 Weeks"
                                status={stock.breakout_52w}
                                high={stock.high_52w}
                                low={stock.low_52w}
                                time={stock.breakout_times?.["52w"] || stock.scan_time}
                            />
                            <BreakoutCard
                                title="All Time High"
                                status={stock.breakout_all}
                                high={stock.high_all}
                                low="--"
                                time={stock.breakout_times?.["all"] || stock.scan_time}
                            />
                            <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-xl flex items-center justify-center p-4 text-center">
                                <div className="text-slate-600 text-xs">
                                    Scan Time:<br />
                                    <span className="font-mono font-bold text-slate-500">{stock.scan_full_time?.split(" ")[1] || "--:--"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Strategy Tags */}
                    {Object.keys(stock.strategy_hits || {}).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                Active Strategy Signals
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(stock.strategy_hits || {}).map(([strat, time]: any) => (
                                    <div key={strat} className="bg-blue-600/10 border border-blue-500/30 px-4 py-2 rounded-lg flex items-center gap-3">
                                        <span className="font-bold text-blue-400 uppercase tracking-wide text-xs">{strat}</span>
                                        <span className="w-1 h-4 bg-blue-500/30 rounded-full"></span>
                                        <span className="font-mono text-xs text-blue-300">{time?.split(" ")[1] || time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 5. NEWS SECTION */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-blue-500">📰</span> Latest Headlines
                        </h3>
                        {loadingNews ? (
                            <div className="text-sm text-slate-500 animate-pulse">Fetching news from Google...</div>
                        ) : news.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {news.map((item, i) => (
                                    <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                                        className="block bg-slate-900/40 border border-slate-800 p-4 rounded-xl hover:bg-slate-800/60 transition-colors group">
                                        <div className="flex flex-col gap-2">
                                            <h4 className="font-bold text-slate-300 group-hover:text-blue-400 leading-snug">{item.title}</h4>
                                            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                                <span>{item.source}</span>
                                                <span className="font-mono opacity-60">{new Date(item.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-600 italic">No recent news found.</div>
                        )}
                    </div>

                </div>
            ) : !analyzing ? (
                <div className="max-w-2xl mx-auto mt-20 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900 border border-slate-800 mb-6">
                        <Search className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">Search to Begin</h3>
                    <p className="text-slate-500">Enter a stock symbol above to view its complete technical profile and breakout status.</p>
                </div>
            ) : null}
        </div>
    );
}

// Helper for cards
const Card = ({ title, value, sub, colorClass = "text-white" }: any) => (
    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
        <div className={`text-xl font-black font-mono ${colorClass}`}>{value}</div>
        {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
);

const BreakoutCard = ({ title, status, high, low, time }: any) => {
    const isBull = status?.includes("Bullish");
    const isBear = status?.includes("Bearish");
    const isNone = !isBull && !isBear;

    return (
        <div className={`bg-slate-900/50 border p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden ${isBull ? "border-emerald-500/30 bg-emerald-500/5" :
            isBear ? "border-red-500/30 bg-red-500/5" : "border-slate-800"
            }`}>
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                {!isNone && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${isBull ? "bg-emerald-500 text-black" : "bg-red-500 text-white"
                        }`}>
                        {isBull ? "BO" : "BD"}
                    </span>
                )}
            </div>

            <div className="flex justify-between items-end mt-1">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500">H: <span className="text-slate-300 font-mono">{high}</span></span>
                    <span className="text-xs text-slate-500">L: <span className="text-slate-300 font-mono">{low}</span></span>
                </div>
            </div>

            {/* Status / Time */}
            {isNone ? (
                <div className="mt-2 text-xs text-slate-600 font-medium italic">Consolidating</div>
            ) : (
                <div className="mt-2 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className={`text-xs font-bold font-mono ${isBull ? "text-emerald-400" : "text-red-400"}`}>
                        {time?.slice(0, 5) || "--:--"}
                    </span>
                </div>
            )}
        </div>
    )
};


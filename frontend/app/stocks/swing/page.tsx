"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus,
    Search, Filter, Activity, BarChart2, RefreshCw
} from "lucide-react";

export default function SwingStocksPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, BULLISH, BEARISH
    const [searchTerm, setSearchTerm] = useState("");
    const API_URL = "http://localhost:8000";

    useEffect(() => {
        fetchSwingStocks();
    }, []);

    const fetchSwingStocks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/strategies/swing`);
            if (res.data.status === "success") {
                setData(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch swing stocks", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data
        .filter((item) => {
            if (filter === "ALL") return true;
            if (filter === "BULLISH") return item.bias === "Bullish";
            if (filter === "BEARISH") return item.bias === "Bearish";
            return true;
        })
        .filter((item) =>
            item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Stats
    const bullishCount = data.filter(d => d.bias === "Bullish").length;
    const bearishCount = data.filter(d => d.bias === "Bearish").length;

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-slate-100 font-sans selection:bg-indigo-500/30">

            {/* Header */}
            <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <span className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                                    <Activity className="w-6 h-6 text-indigo-400" />
                                </span>
                                Swing Radar
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Multi-day trend & momentum scanner (Daily Timeframe)
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Quick Stats */}
                            {!loading && (
                                <div className="hidden md:flex gap-4 text-xs font-mono">
                                    <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3" /> {bullishCount} Bullish
                                    </div>
                                    <div className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                                        <TrendingDown className="w-3 h-3" /> {bearishCount} Bearish
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={fetchSwingStocks}
                                disabled={loading}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">

                    {/* Filters */}
                    <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
                        {['ALL', 'BULLISH', 'BEARISH'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {f.charAt(0) + f.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search symbol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 w-full md:w-64 transition-all"
                        />
                    </div>
                </div>

                {/* Table / Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <div className="text-slate-500 text-sm animate-pulse">Scanning 200+ F&O stocks... This may take a moment.</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-medium">
                                    <th className="p-4 pl-6">Symbol</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4">Trend</th>
                                    <th className="p-4">Swing Bias</th>
                                    <th className="p-4">Momentum Score</th>
                                    <th className="p-4">Supp / Res</th>
                                    <th className="p-4">Indicators</th>
                                    <th className="p-4 pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredData.map((stock) => (
                                    <tr key={stock.token} className="group hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 pl-6 font-medium text-white group-hover:text-indigo-300 transition-colors">
                                            {stock.symbol}
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">NSE-EQ</div>
                                        </td>

                                        <td className="p-4 font-mono text-slate-300">
                                            ₹{stock.ltp.toLocaleString('en-IN')}
                                        </td>

                                        <td className="p-4">
                                            <TrendBadge trend={stock.trend} />
                                        </td>

                                        <td className="p-4">
                                            <BiasBadge bias={stock.bias} />
                                        </td>

                                        <td className="p-4 font-mono">
                                            <div className={`flex items-center gap-1 ${stock.momentum_score > 0 ? 'text-emerald-400' : stock.momentum_score < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                                {stock.momentum_score > 0 ? '+' : ''}{stock.momentum_score}
                                                {Math.abs(stock.momentum_score) > 2 && <ZapIcon />}
                                            </div>
                                            <div className="flex gap-1 mt-1">
                                                <div className={`h-1 rounded-full ${stock.momentum_score > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(stock.momentum_score) * 10, 40)}px` }} />
                                            </div>
                                        </td>

                                        <td className="p-4 text-xs font-mono text-slate-400 space-y-1">
                                            <div className="flex justify-between w-24"><span>S:</span> <span className="text-slate-300">{stock.support}</span></div>
                                            <div className="flex justify-between w-24"><span>R:</span> <span className="text-slate-300">{stock.resistance}</span></div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1.5 w-32">
                                                {stock.indicators.map((ind: string, i: number) => (
                                                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 border border-slate-700 text-slate-400">
                                                        {ind}
                                                    </span>
                                                ))}
                                                {stock.indicators.length === 0 && <span className="text-slate-600 text-xs">-</span>}
                                            </div>
                                        </td>

                                        <td className="p-4 pr-6">
                                            <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 px-3 py-1.5 rounded transition-all">
                                                Chart
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredData.length === 0 && (
                            <div className="p-12 text-center text-slate-500">
                                No stocks found matching your criteria.
                            </div>
                        )}
                    </div>
                )}

            </div>
        </main>
    );
}

// Sub-components

function TrendBadge({ trend }: { trend: string }) {
    if (trend === "Uptrend") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" /> Uptrend
            </span>
        );
    }
    if (trend === "Downtrend") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                <TrendingDown className="w-3 h-3" /> Downtrend
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <Minus className="w-3 h-3" /> Sideways
        </span>
    );
}

function BiasBadge({ bias }: { bias: string }) {
    let color = "bg-slate-800 text-slate-400 border-slate-700";
    if (bias === "Bullish") color = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    if (bias === "Bearish") color = "bg-orange-500/10 text-orange-400 border-orange-500/20";

    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${color}`}>
            {bias}
        </span>
    );
}

function ZapIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap text-yellow-500/80"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    )
}

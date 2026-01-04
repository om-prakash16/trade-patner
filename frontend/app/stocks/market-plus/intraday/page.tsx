"use client";

import { useMarketData } from "@/hooks/useMarketData";
import BreakoutTable from "@/components/market-plus/BreakoutTable";
import DayStatTable from "@/components/market-plus/DayStatTable";
import MoverTable from "@/components/market-plus/MoverTable";
import { RefreshCw, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Flame, BarChart2 } from "lucide-react";

export default function IntradayPage() {
    const { data, loading, fetchData } = useMarketData();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Market Plus</h1>
                    <p className="text-slate-500 dark:text-slate-400">Advanced intraday signals, breakouts, and market movers.</p>
                </div>
                <button onClick={() => fetchData()} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white self-start md:self-auto">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                </button>
            </div>

            {/* Main Beacon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <BreakoutTable
                    data={data}
                    config={{
                        id: "1d",
                        title: "Intraday Boost",
                        key: "breakout_1d",
                        desc: "Immediate Momentum (Prev Day High/Low)",
                        highKey: "high_1d",
                        lowKey: "low_1d",
                        timeFrame: "1-DAY"
                    }}
                />
                <BreakoutTable
                    data={data}
                    config={{
                        id: "2d",
                        title: "2-Day Breakout",
                        key: "breakout_2d",
                        desc: "Short Term Continuation",
                        highKey: "high_2d",
                        lowKey: "low_2d",
                        timeFrame: "2-DAY"
                    }}
                />
            </div>



            {/* Level Stocks Section (2 Cols) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DayStatTable
                    data={data}
                    config={{
                        title: "TOP LEVEL STOCKS",
                        type: "HIGH",
                        icon: <div className="text-2xl">⚡</div>
                    }}
                />
                <DayStatTable
                    data={data}
                    config={{
                        title: "LOW LEVEL STOCKS",
                        type: "LOW",
                        icon: <div className="text-2xl">🔻</div>
                    }}
                />
            </div>

            {/* Movers Section (3 Cols -> 2 Cols with Span) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <MoverTable
                        data={data}
                        config={{
                            title: "HIGH POW. STOCKS",
                            type: "POWER",
                            icon: <div className="text-2xl">🔥</div>
                        }}
                    />
                </div>
                <MoverTable
                    data={data}
                    config={{
                        title: "TOP GAINERS",
                        type: "GAINER",
                        icon: <div className="w-8 h-8 rounded bg-gradient-to-t from-green-500 to-emerald-400 flex items-center justify-center text-white"><ArrowUp className="w-5 h-5" /></div>
                    }}
                />
                <MoverTable
                    data={data}
                    config={{
                        title: "TOP LOSERS",
                        type: "LOSER",
                        icon: <div className="w-8 h-8 rounded bg-gradient-to-t from-red-500 to-orange-400 flex items-center justify-center text-white"><ArrowDown className="w-5 h-5" /></div>
                    }}
                />
            </div>
        </div>
    );
}

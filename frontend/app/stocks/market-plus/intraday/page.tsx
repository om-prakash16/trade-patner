"use client";

import { useMarketData } from "@/hooks/useMarketData";
import BreakoutTable from "@/components/market-plus/BreakoutTable";
import DayStatTable from "@/components/market-plus/DayStatTable";
import MoverTable from "@/components/market-plus/MoverTable";
import { RefreshCw, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Flame, BarChart2 } from "lucide-react";

export default function IntradayPage() {
    const { data, loading, fetchData } = useMarketData();

    return (
        <div className="space-y-8">
            <div className="flex justify-end">
                <button onClick={() => fetchData()} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm dark:shadow-none">
                    <RefreshCw className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Main Beacon */}
            <div className="grid grid-cols-1 gap-8">
                <BreakoutTable
                    data={data}
                    config={{
                        id: "1d",
                        title: "Intraday Boost",
                        key: "breakout_1d",
                        desc: "Immediate Momentum (Prev Day High/Low)",
                        highKey: "high_1d",
                        lowKey: "low_1d"
                    }}
                />
            </div>

            {/* Sub Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Day High */}
                <DayStatTable
                    data={data}
                    config={{
                        title: "TOP LEVEL STOCKS",
                        type: "HIGH",
                        icon: <div className="text-2xl">⚡</div>
                        // Using emoji as placeholder or specific SVG if needed, user used candle in image
                        // Let's use a colored div for candle
                    }}
                />

                {/* Day Low */}
                <DayStatTable
                    data={data}
                    config={{
                        title: "LOW LEVEL STOCKS",
                        type: "LOW",
                        icon: <div className="text-2xl">🔻</div>
                    }}
                />

                {/* Top Gainers */}
                <MoverTable
                    data={data}
                    config={{
                        title: "TOP GAINERS",
                        type: "GAINER",
                        icon: <div className="w-8 h-8 rounded bg-gradient-to-t from-green-500 to-emerald-400 flex items-center justify-center text-white"><ArrowUp className="w-5 h-5" /></div>
                    }}
                />

                {/* Top Losers */}
                <MoverTable
                    data={data}
                    config={{
                        title: "TOP LOSERS",
                        type: "LOSER",
                        icon: <div className="w-8 h-8 rounded bg-gradient-to-t from-red-500 to-orange-400 flex items-center justify-center text-white"><ArrowDown className="w-5 h-5" /></div>
                    }}
                />

                {/* High Power */}
                <MoverTable
                    data={data}
                    config={{
                        title: "HIGH POW. STOCKS",
                        type: "POWER",
                        icon: <div className="text-2xl">🔥</div>
                    }}
                />
            </div>
        </div>
    );
}

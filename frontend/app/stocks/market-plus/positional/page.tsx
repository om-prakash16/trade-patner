"use client";

import { useMarketData } from "@/hooks/useMarketData";
import BreakoutTable from "@/components/market-plus/BreakoutTable";
import { RefreshCw } from "lucide-react";

export default function PositionalPage() {
    const { data, loading, fetchData } = useMarketData();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Positional Scanners</h1>
                    <p className="text-slate-400">Multi-day breakout signals for swing and positional trading.</p>
                </div>
                <button onClick={() => fetchData()} className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white self-start md:self-auto">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                </button>
            </div>

            {/* Positional Scanners Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* 10 Day */}
                <BreakoutTable
                    data={data}
                    config={{
                        id: "10d",
                        title: "10-Day Breakout",
                        key: "breakout_10d",
                        desc: "Short Term Swing",
                        highKey: "high_10d",
                        lowKey: "low_10d",
                        timeFrame: "SHORT TERM"
                    }}
                />

                {/* 30 Day */}
                <BreakoutTable
                    data={data}
                    config={{
                        id: "30d",
                        title: "30-Day Breakout",
                        key: "breakout_30d",
                        desc: "Monthly Swing",
                        highKey: "high_30d",
                        lowKey: "low_30d",
                        timeFrame: "MONTHLY"
                    }}
                />

                {/* 50 Day */}
                <BreakoutTable
                    data={data}
                    config={{
                        id: "50d",
                        title: "50-Day Breakout",
                        key: "breakout_50d",
                        desc: "Quarterly Trend",
                        highKey: "high_50d",
                        lowKey: "low_50d",
                        timeFrame: "QUARTERLY"
                    }}
                />

                {/* 100 Day */}
                <BreakoutTable
                    data={data}
                    config={{
                        id: "100d",
                        title: "100-Day Breakout",
                        key: "breakout_100d",
                        desc: "Medium Term Trend",
                        highKey: "high_100d",
                        lowKey: "low_100d",
                        timeFrame: "MEDIUM TERM"
                    }}
                />

                {/* 52 Week */}
                <BreakoutTable
                    data={data}
                    config={{
                        id: "52w",
                        title: "52-Week Breakout",
                        key: "breakout_52w",
                        desc: "Yearly High/Low",
                        highKey: "high_52w",
                        lowKey: "low_52w",
                        timeFrame: "YEARLY"
                    }}
                />

                {/* All Time */}
                <BreakoutTable
                    data={data}
                    config={{
                        id: "all",
                        title: "All-Time Breakout",
                        key: "breakout_all",
                        desc: "Blue Sky Zone",
                        highKey: "high_all",
                        lowKey: "high_all", // Use high for both as fallback, though logic handles it
                        timeFrame: "HISTORICAL"
                    }}
                />
            </div>
        </div>
    );
}

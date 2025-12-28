"use client";

import { useMarketData } from "@/hooks/useMarketData";
import BreakoutTable from "@/components/market-plus/BreakoutTable";
import { RefreshCw } from "lucide-react";

const SECTIONS = [
    {
        id: "10d",
        title: "10-Day Breakouts",
        key: "breakout_10d",
        desc: "Intraday / short swing energy",
        highKey: "high_10d",
        lowKey: "low_10d"
    },
    {
        id: "30d",
        title: "30-Day Breakouts",
        key: "breakout_30d",
        desc: "Swing continuation",
        highKey: "high_30d",
        lowKey: "low_30d"
    },
    {
        id: "50d",
        title: "50-Day Breakouts",
        key: "breakout_50d",
        desc: "Trend confirmation",
        highKey: "high_50d",
        lowKey: "low_50d"
    },
    {
        id: "100d",
        title: "100-Day Breakouts",
        key: "breakout_100d",
        desc: "Medium-term trend shift",
        highKey: "high_100d",
        lowKey: "low_100d"
    },
    {
        id: "52w",
        title: "52-Week Breakouts",
        key: "breakout_52w",
        desc: "Long-term leadership",
        highKey: "high_52w",
        lowKey: "low_52w"
    },
    {
        id: "all",
        title: "All Time Breakouts",
        key: "breakout_all",
        desc: "Blue Sky Territory",
        highKey: "high_all",
        lowKey: "low_all"
    },
];

export default function PositionalPage() {
    const { data, loading, fetchData } = useMarketData();

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={() => fetchData()} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm dark:shadow-none">
                    <RefreshCw className={`w-5 h-5 text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {SECTIONS.map(section => (
                    <div key={section.id} className={section.id === "52w" ? "xl:col-span-2" : ""}>
                        <BreakoutTable
                            config={section}
                            data={data}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

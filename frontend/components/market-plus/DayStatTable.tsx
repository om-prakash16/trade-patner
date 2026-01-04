"use client";

import { ArrowUp, ArrowDown, Search } from "lucide-react";
import { StockData } from "@/lib/types";

import { ReactNode } from "react";

interface DayStatConfig {
    title: string;
    type: "HIGH" | "LOW";
    icon: ReactNode;
}

export default function DayStatTable({ config, data }: { config: DayStatConfig, data: StockData[] }) {
    // Sort logic: 
    // High: Closest to Day High (diff ascending)
    // Low: Closest to Day Low (diff ascending)

    const processed = data.map(item => {
        const target = config.type === "HIGH" ? item.day_high : item.day_low;
        const diff = Math.abs(item.ltp - target);
        return { ...item, diff, target };
    })
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 10); // Show more since we scroll

    return (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px] shadow-lg">
            {/* Header Section */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                {/* Top Row: Title, Live Badge, Search (Dummy for uniformity if needed, or just spacers) */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {config.icon}
                        <h3 className="font-black text-base md:text-lg text-slate-800 dark:text-white font-display uppercase tracking-wide">{config.title}</h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                            </span>
                            <span className="text-[9px] font-bold text-slate-300 tracking-wider">LIVE</span>
                        </div>
                    </div>

                    {/* Optional: Compact Search or Actions */}
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="..."
                            disabled // No client side filter here yet usually
                            className="w-20 bg-slate-900 border border-slate-700 rounded-md pl-8 pr-2 py-1 text-[10px] text-slate-500 focus:outline-none cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-700">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#111827] text-slate-500 sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800/50">
                        <tr>
                            <th className="px-4 py-2.5 font-bold uppercase text-[10px] tracking-wider">Symbol</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Price</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Vol</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Target</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Diff</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/30">
                        {processed.map(item => (
                            <tr key={item.token} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-default">
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1 h-3 rounded-full ${item.change_pct >= 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"}`}></div>
                                        <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.symbol}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
                                    {item.ltp.toFixed(1)}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-400 text-[10px]">
                                    {(item.volume / 10000000).toFixed(2)}Cr
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                                    {item.target?.toFixed(1)}
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold text-slate-700 dark:text-slate-300">
                                    {item.diff.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { Info, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { StockData } from "@/lib/types";

interface BreakoutConfig {
    id: string;
    title: string;
    key: keyof StockData;
    desc: string;
    highKey: keyof StockData;
    lowKey: keyof StockData;
    timeFrame?: string;
}

export default function BreakoutTable({ config, data }: { config: BreakoutConfig, data: StockData[] }) {
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
    const [filterType, setFilterType] = useState<"All" | "Bullish" | "Bearish">("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Sort & Filter
    const sorted = [...data]
        .filter((item) => {
            const status = item[config.key];
            if (!status || !status.includes("Breakout")) return false;

            if (filterType === "All") return true;
            if (filterType === "Bullish") return status.includes("Bullish");
            if (filterType === "Bearish") return status.includes("Bearish");
            return false;
        })
        .filter(item => item.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) =>
            sortOrder === "desc" ? b.change_pct - a.change_pct : a.change_pct - b.change_pct
        );

    const getBadge = (status: string) => {
        const isBullish = status?.includes("Bullish");
        return (
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shadow-sm ${isBullish
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                {isBullish ? "BULL" : "BEAR"}
            </span>
        );
    };

    return (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col h-[500px] shadow-lg">
            {/* Header Section */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">💡</span>
                        <div>
                            <h3 className="font-black text-base md:text-lg text-slate-800 dark:text-white font-display uppercase tracking-wide">{config.title.replace(/Breakouts?/i, "").trim()} BEACON</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-500 tracking-wider">{config.timeFrame || "INTRADAY"}</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-300 tracking-wider">LIVE</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Filter Toggles */}
                        <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                            {["All", "Bullish", "Bearish"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type as any)}
                                    className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all ${filterType === type
                                        ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                >
                                    {type === "Bearish" ? "BEAR" : type === "Bullish" ? "BULL" : "ALL"}
                                </button>
                            ))}
                        </div>

                        {/* Compact Search */}
                        <div className="relative group flex-1 md:flex-none">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-24 focus:w-32 transition-all duration-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md pl-8 pr-2 py-1 text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-700">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#111827] text-slate-500 sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800/50">
                        <tr>
                            <th className="px-4 py-2.5 font-bold uppercase text-[10px] tracking-wider">Signal</th>
                            <th className="px-4 py-2.5 font-bold uppercase text-[10px] tracking-wider">Symbol</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Price</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Level</th>
                            <th
                                className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right cursor-pointer hover:text-white group"
                                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    % CHG
                                    {sortOrder === "desc" ? <ArrowDown className="w-3 h-3 text-slate-500 group-hover:text-white" /> : <ArrowUp className="w-3 h-3 text-slate-500 group-hover:text-white" />}
                                </div>
                            </th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Vol</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/30">
                        {sorted.length > 0 ? sorted.map((item) => {
                            const status = item[config.key];
                            const timeId = config.id.toLowerCase();
                            const rawTime = item.breakout_times?.[timeId] || item.scan_full_time || item.scan_time || "--:--";
                            // If it's a full Date-Time (YYYY-MM-DD HH:MM:SS), split it. If just Time, use it.
                            const breakoutTime = rawTime.includes(" ") ? rawTime.split(" ")[1].slice(0, 5) : rawTime.slice(0, 5);

                            return (
                                <tr key={item.token} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-default">
                                    <td className="px-4 py-2.5">
                                        {getBadge(status)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1 h-3 rounded-full ${item.change_pct >= 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"}`}></div>
                                            <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.symbol}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300 font-bold">
                                        {item.ltp.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-slate-500 text-[10px]">
                                        {status.includes("Bullish")
                                            ? Number(item[config.highKey]).toFixed(2)
                                            : Number(item[config.lowKey]).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-bold">
                                        <span className={`px-1.5 py-0.5 rounded ${item.change_pct >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                            {item.change_pct > 0 ? "+" : ""}{item.change_pct.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-slate-400 text-[10px]">
                                        {(item.volume / 10000000).toFixed(2)}Cr
                                    </td>
                                    <td className={`px-3 py-2.5 text-right font-mono text-[10px] font-bold ${breakoutTime !== "--:--" ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600"}`}>
                                        {breakoutTime}
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-600 italic text-xs">No Active Signals</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

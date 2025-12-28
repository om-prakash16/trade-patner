"use client";

import { useState } from "react";
import { Info, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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
            // Ensure it's a breakout signal
            if (!status || !status.includes("Breakout")) return false;

            // Filter by Type (Bullish/Bearish)
            if (filterType === "All") return true;
            if (filterType === "Bullish") return status.includes("Bullish");
            if (filterType === "Bearish") return status.includes("Bearish");
            return false; // Should not be reached
        })
        .filter(item => item.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) =>
            sortOrder === "desc" ? b.change_pct - a.change_pct : a.change_pct - b.change_pct
        );

    const getBadge = (status: string) => {
        const isBullish = status?.includes("Bullish");
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider border shadow-sm ${isBullish
                ? "bg-[#D1FADF] text-[#027A48] border-[#32D583]" // Bullish Green Theme
                : "bg-[#FEE4E2] text-[#B42318] border-[#FECDCA]" // Bearish Red Theme
                }`}>
                {isBullish ? "BULL" : "BEAR"}
            </span>
        );
    };

    return (
        <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 font-display">
                            {config.title.replace("Breakouts", "").trim()} BEACON
                        </h2>
                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                            {config.timeFrame || "INTRADAY"} STATUS
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search Symbol..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 sm:w-48 placeholder:text-slate-500 text-slate-200"
                        />
                    </div>

                    {/* Filter Toggles */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {["All", "Bullish", "Bearish"].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type as any)}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${filterType === type
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                            >
                                {type === "Bearish" ? "Neutral" : type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#111827] text-white rounded-xl border border-slate-800 overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                        <tr>
                            <th className="px-4 py-3">Signal</th>
                            <th className="px-4 py-3">Symbol</th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors select-none group"
                                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    % Change
                                    {sortOrder === "desc" ? <ArrowDown className="w-3 h-3 text-slate-500 group-hover:text-white" /> : <ArrowUp className="w-3 h-3 text-slate-500 group-hover:text-white" />}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right">Signal %</th>
                            <th className="px-4 py-3 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {sorted.length > 0 ? sorted.map((item) => {
                            const status = item[config.key];
                            const isBullish = status?.includes("Bullish");
                            const targetLevel = isBullish ? item[config.highKey] : item[config.lowKey];

                            // Enhance: Calculate Diff from Pivot
                            const diff = targetLevel ? ((item.ltp - targetLevel) / targetLevel) * 100 : 0;
                            const diffFormatted = Math.abs(diff).toFixed(2);

                            // Get specific time for this timeframe (Do NOT fallback to scan_time for accuracy)
                            const timeId = config.id.toLowerCase();
                            const breakoutTime = item.breakout_times?.[timeId] || "--:--";

                            return (
                                <tr key={item.token} className="hover:bg-slate-800/30 group transition-colors text-xs font-medium">
                                    <td className="px-4 py-3">
                                        {getBadge(status)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {/* Pseudo Logo */}
                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${isBullish ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                                                }`}>
                                                {item.symbol[0]}
                                            </div>
                                            <span className="font-bold text-slate-200">{item.symbol}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`px-2 py-1 rounded text-[11px] font-bold ${item.change_pct >= 0
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-red-500/10 text-red-400"
                                            }`}>
                                            {item.change_pct > 0 ? "+" : ""}{item.change_pct.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                                        <span className={isBullish ? "text-emerald-400" : "text-red-400"}>
                                            {diff > 0 ? "+" : ""}{diffFormatted}%
                                        </span>
                                    </td>
                                    <td className={`px-4 py-3 text-right font-mono font-bold ${breakoutTime !== "--:--" ? "text-white" : "text-slate-600"
                                        }`}>
                                        {breakoutTime}
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-600 italic">No Active Signals</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

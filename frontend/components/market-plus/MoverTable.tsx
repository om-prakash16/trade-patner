"use client";

import { ArrowUp, ArrowDown, Search } from "lucide-react";
import { StockData } from "@/lib/types";

import { ReactNode } from "react";

interface MoverConfig {
    title: string;
    type: "GAINER" | "LOSER" | "POWER";
    icon: ReactNode;
}

export default function MoverTable({ config, data }: { config: MoverConfig, data: StockData[] }) {

    const processed = [...data].sort((a, b) => {
        if (config.type === "GAINER") return b.change_pct - a.change_pct;
        if (config.type === "LOSER") return a.change_pct - b.change_pct; // Most negative first
        if (config.type === "POWER") return b.turnover - a.turnover; // Highest turnover first
        return 0;
    }).slice(0, 50); // Show more for scrolling

    const getRightColumn = (item: StockData) => {
        if (config.type === "POWER") {
            // Turnover (Already in Cr from backend)
            return item.turnover.toFixed(2) + " Cr";
        }
        // R.Fac (Strength Score / 10 proxy)
        const rfac = (item.strength_score / 10).toFixed(2);
        return rfac;
    };

    const getRightHeader = () => {
        if (config.type === "POWER") return "TURNOVER";
        return "R.FAC";
    };

    return (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px] shadow-lg">
            {/* Header Section */}
            <div className="p-4 border-b border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {config.icon}
                        <h3 className="font-black text-base md:text-lg text-white font-display uppercase tracking-wide">{config.title}</h3>
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

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent hover:scrollbar-thumb-slate-700">
                <table className="w-full text-left text-xs">
                    <thead className="bg-[#111827] text-slate-500 sticky top-0 z-10 shadow-sm border-b border-slate-800/50">
                        <tr>
                            <th className="px-4 py-2.5 font-bold uppercase text-[10px] tracking-wider">Symbol</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Price</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">%</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Vol</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">{getRightHeader()}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {processed.map(item => (
                            <tr key={item.token} className="group hover:bg-slate-800/40 transition-colors cursor-default">
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1 h-3 rounded-full ${item.change_pct >= 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"}`}></div>
                                        <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{item.symbol}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-400 group-hover:text-slate-200">
                                    {item.ltp.toFixed(1)}
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold">
                                    <span className={`px-1.5 py-0.5 rounded ${item.change_pct >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                        {item.change_pct > 0 ? "+" : ""}{item.change_pct.toFixed(2)}%
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-400 text-[10px]">
                                    {(item.volume / 10000000).toFixed(2)}Cr
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-400">
                                    {getRightColumn(item)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

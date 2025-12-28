"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { StockData } from "@/lib/types";

interface DayStatConfig {
    title: string;
    type: "HIGH" | "LOW";
    icon: any;
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
        .slice(0, 5); // Top 5

    return (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
            <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-2">
                    {config.icon}
                    <div>
                        <h3 className="font-black text-sm uppercase tracking-wider text-slate-100">{config.title}</h3>
                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> LIVE
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" className="bg-slate-950 border border-slate-800 rounded-full w-24 pl-7 pr-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-slate-600" />
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800">
                        <tr>
                            <th className="px-4 py-2 font-medium">Symbol</th>
                            <th className="px-4 py-2 font-medium text-right">%</th>
                            <th className="px-4 py-2 font-medium text-right">Diff</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {processed.map(item => (
                            <tr key={item.token} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-200 flex items-center gap-2">
                                    <div className={`w-1 h-3 rounded-full ${item.change_pct >= 0 ? "bg-emerald-500" : "bg-red-500"}`}></div>
                                    {item.symbol}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.change_pct >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                        }`}>
                                        {item.change_pct.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-slate-400 text-[11px]">
                                    {item.diff.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {processed.length === 0 && (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-600 italic text-[10px]">Scanning...</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

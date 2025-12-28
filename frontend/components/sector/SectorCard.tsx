"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Search } from "lucide-react";
import { StockData } from "@/lib/types";

interface SectorCardProps {
    sector: string;
    stocks: StockData[];
    avgChange: number;
}

export default function SectorCard({ sector, stocks, avgChange }: SectorCardProps) {
    const [search, setSearch] = useState("");

    // Filter stocks
    const filteredStocks = stocks.filter(s =>
        s.symbol.toLowerCase().includes(search.toLowerCase())
    );

    const upStocks = filteredStocks.filter(s => s.change_pct > 0).length;
    const downStocks = filteredStocks.filter(s => s.change_pct <= 0).length;
    const total = filteredStocks.length;

    const upPct = total > 0 ? (upStocks / total) * 100 : 0;
    const downPct = total > 0 ? (downStocks / total) * 100 : 0;

    return (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
            {/* Header Section */}
            <div className="p-4 border-b border-slate-800 flex flex-col gap-4">

                {/* Top Row: Title, Live Badge, Search */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-black text-base md:text-lg text-white font-display uppercase tracking-wide">{sector}</h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                            </span>
                            <span className="text-[9px] font-bold text-slate-300 tracking-wider">LIVE</span>
                        </div>
                    </div>

                    {/* Compact Search */}
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-24 focus:w-32 transition-all duration-300 bg-slate-900 border border-slate-700 rounded-md pl-8 pr-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                        />
                    </div>
                </div>

                {/* VISUAL BAR - Standardized: Red Left (Down), Green Right (Up) */}
                <div className="space-y-2">
                    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-900 border border-slate-800/50">
                        {/* Down (Red) */}
                        <div style={{ width: `${downPct}%` }} className="bg-red-500/90 shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-all duration-700 ease-out"></div>
                        {/* Up (Green) */}
                        <div style={{ width: `${upPct}%` }} className="bg-emerald-500/90 shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all duration-700 ease-out ml-auto"></div>
                    </div>

                    {/* Stats Text */}
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-wide">
                        <div className={`flex items-center gap-1.5 ${downStocks > 0 ? "text-red-400" : "text-slate-600"}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${downStocks > 0 ? "bg-red-500" : "bg-slate-700"}`}></div>
                            <span>{downStocks} stocks <span className="opacity-60">({downPct.toFixed(0)}% Down)</span></span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${upStocks > 0 ? "text-emerald-400" : "text-slate-600"}`}>
                            <span><span className="opacity-60">({upPct.toFixed(0)}% Up)</span> {upStocks} stocks</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${upStocks > 0 ? "bg-emerald-500" : "bg-slate-700"}`}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent hover:scrollbar-thumb-slate-700">
                <table className="w-full text-left text-xs">
                    <thead className="bg-[#111827] text-slate-500 sticky top-0 z-10 shadow-sm border-b border-slate-800/50">
                        <tr>
                            <th className="px-4 py-2.5 font-bold uppercase text-[10px] tracking-wider">Symbol</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">Price</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-right">%</th>
                            <th className="px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider text-center">Sig</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {filteredStocks.map(stock => (
                            <tr key={stock.token} className="group hover:bg-slate-800/40 transition-colors cursor-default">
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1 h-3 rounded-full ${stock.change_pct >= 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"}`}></div>
                                        <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{stock.symbol}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-400 group-hover:text-slate-200">
                                    {stock.ltp.toFixed(1)}
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold">
                                    <span className={`px-1.5 py-0.5 rounded ${stock.change_pct >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                        {stock.change_pct > 0 ? "+" : ""}{stock.change_pct.toFixed(2)}%
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                    {stock.change_pct > 0 ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-emerald-500 mx-auto" strokeWidth={3} />
                                    ) : (
                                        <ArrowDown className="w-3.5 h-3.5 text-red-500 mx-auto" strokeWidth={3} />
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredStocks.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center">
                                    <p className="text-slate-600 italic text-xs">No stocks found</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

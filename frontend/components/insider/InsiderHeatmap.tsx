import { Play, Info } from "lucide-react";

interface StockItem {
    symbol: string;
    value: number; // For styling logic (opacity or color intensity)
    percent: number; // Added for display
    isPositive: boolean;
    size?: "large" | "medium" | "small";
}

interface InsiderHeatmapProps {
    title: string;
    timeFrame: "5min" | "10min";
    items: StockItem[];
}

export default function InsiderHeatmap({ title, timeFrame, items }: InsiderHeatmapProps) {
    return (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                    {/* Icon placeholder */}
                    <div className="text-xl font-black italic text-white flex items-end leading-none tracking-tighter"
                        style={{ textShadow: "0 0 15px rgba(59, 130, 246, 0.6)" }}>
                        <span className="text-blue-500 text-3xl font-display">{timeFrame.replace("min", "")}</span>
                        <span className="text-white text-lg ml-0.5 font-display">min</span>
                    </div>
                    {/* Candles */}
                    <div className="absolute -bottom-1 -right-4 flex items-end gap-[2px] opacity-90 filter drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                        <div className="w-[3px] h-2 bg-red-500 rounded-sm"></div>
                        <div className="w-[3px] h-3 bg-emerald-500 rounded-sm"></div>
                        <div className="w-[3px] h-4 bg-red-500 rounded-sm"></div>
                        <div className="w-[3px] h-5 bg-emerald-400 rounded-sm shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                    </div>
                </div>

                <div className="ml-8">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2 tracking-tight">
                        {title}
                        <span className="text-yellow-400 filter drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">💡</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[11px] text-blue-400 font-bold uppercase tracking-wide cursor-pointer hover:text-blue-300 transition-colors">
                            How to use <Play className="w-2.5 h-2.5 fill-current" />
                        </div>
                        <div className="bg-red-500/20 border border-red-500/30 rounded px-1.5 py-0.5 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_5px_currentColor]"></div>
                            <span className="text-[10px] font-black text-red-400 tracking-widest">LIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-[2px] rounded-lg overflow-hidden border border-slate-800 bg-slate-900 h-[450px]">
                {items.map((item, idx) => {
                    let gridClass = "";
                    // Simulating Treemap sizing
                    if (idx === 0) gridClass = "col-span-2 row-span-2";
                    else if (idx === 1) gridClass = "col-span-1 row-span-2";
                    else if (idx === 2) gridClass = "col-span-1 row-span-1";
                    else if (idx === 3) gridClass = "col-span-1 row-span-1";
                    else gridClass = "col-span-1 row-span-1";

                    // Professional Gradients
                    // Green: Emerald to Green-600
                    // Red: Rose-900 to Red-900 (Deep, intense red for bearish)
                    const bgClass = item.isPositive
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]"
                        : "bg-gradient-to-br from-rose-700 to-red-900 hover:from-rose-600 hover:to-red-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]";

                    return (
                        <div
                            key={idx}
                            className={`${gridClass} ${bgClass} p-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative overflow-hidden`}
                        >
                            {/* Subtle gloss effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-50"></div>

                            <span className="relative z-10 text-xs md:text-sm font-black text-white tracking-tight drop-shadow-sm group-hover:scale-105 transition-transform duration-300">
                                {item.symbol}
                            </span>
                            {/* Percent Value */}
                            <span className="relative z-10 text-[10px] md:text-xs font-medium text-white/90 mt-0.5 group-hover:text-white transition-colors">
                                {item.percent > 0 ? "+" : ""}{item.percent?.toFixed(2)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

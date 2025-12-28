"use client";

interface SectorBarChartProps {
    sectorData: { name: string; avgChange: number }[];
}

export default function SectorBarChart({ sectorData }: SectorBarChartProps) {
    const sorted = [...sectorData].sort((a, b) => b.avgChange - a.avgChange);

    // Find absolute max for scaling (min 1% to avoid div/0)
    const maxVal = Math.max(...sorted.map(s => Math.abs(s.avgChange)), 1.0);

    return (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-lg text-white font-display uppercase tracking-wide">Sector Performance</h3>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-300">REALTIME</span>
                </div>
            </div>

            <div className="text-[10px] text-slate-500 font-mono mb-6">
                COMPARATIVE PERFORMANCE (%)
            </div>

            {/* Chart Container */}
            <div className="relative h-[250px] w-full bg-slate-900/30 rounded-lg border border-slate-800/50 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pb-8">

                {/* Center Zero Line */}
                <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-slate-700 z-0"></div>

                {/* Bars Container */}
                <div className="flex items-center h-full px-6 gap-6 min-w-max">
                    {sorted.map((item) => {
                        const isPos = item.avgChange >= 0;
                        const heightPct = (Math.abs(item.avgChange) / maxVal) * 40; // Max 40% height (leaves 10% gap)

                        return (
                            <div key={item.name} className="relative h-full w-12 flex flex-col justify-center items-center group z-10">

                                {/* The Bar Wrapper - Centered at 50% */}
                                <div className="absolute top-0 bottom-0 left-0 right-0">
                                    {/* Center Anchor Point is 50% */}

                                    {/* The Bar Itself */}
                                    <div
                                        className={`absolute left-0 right-0 mx-auto w-6 md:w-8 rounded-sm transition-all duration-500 group-hover:w-10 group-hover:opacity-100 opacity-90 ${isPos ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"}`}
                                        style={{
                                            height: `${Math.max(heightPct, 1)}%`, // Min 1% visibility
                                            // Position:
                                            // If Pos: Bottom of bar is at 50%
                                            // If Neg: Top of bar is at 50%
                                            bottom: isPos ? "50%" : "auto",
                                            top: isPos ? "auto" : "50%",
                                        }}
                                    ></div>
                                </div>

                                {/* Value Label */}
                                <div
                                    className={`absolute w-max text-[10px] font-bold font-mono transition-all ${isPos ? "text-emerald-400 group-hover:-translate-y-1" : "text-red-400 group-hover:translate-y-1"}`}
                                    style={{
                                        bottom: isPos ? `calc(50% + ${heightPct}% + 8px)` : "auto",
                                        top: isPos ? "auto" : `calc(50% + ${heightPct}% + 8px)`
                                    }}
                                >
                                    {isPos ? "+" : ""}{item.avgChange.toFixed(2)}%
                                </div>

                                {/* Category Label (Fixed at bottom or nicely placed?) 
                                     Let's place it at the absolute bottom of the container
                                 */}
                                <div className="absolute bottom-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider rotate-0 whitespace-nowrap group-hover:text-white transition-colors">
                                    {item.name}
                                </div>

                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

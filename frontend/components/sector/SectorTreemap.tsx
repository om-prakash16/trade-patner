"use client";

interface SectorTreemapProps {
    sectorData: { name: string; avgChange: number; count: number }[];
}

export default function SectorTreemap({ sectorData }: SectorTreemapProps) {
    // Sort by count (Area size importance) or maybe strict alphabetical?
    // Let's sort by Count DESC so big sectors are first
    const sorted = [...sectorData].sort((a, b) => b.count - a.count);

    return (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-black text-lg text-white font-display uppercase tracking-wide">Sector Heatmap</h3>
                <div className="text-[10px] text-slate-500 font-mono">SIZE = STOCK COUNT • COLOR = % CHANGE</div>
            </div>

            <div className="flex-1 p-2 flex flex-wrap content-start gap-1 overflow-hidden">
                {sorted.map((item) => {
                    // Calculate "Flex Grow" based on count. 
                    // To avoid tiny sectors disappearing, give a min-width.
                    // Also define a color intensity based on change magnitude

                    const change = item.avgChange;
                    let bgColor = "bg-slate-700";
                    let textColor = "text-slate-200";

                    // Green Scale
                    if (change > 3) bgColor = "bg-emerald-600";
                    else if (change > 1.5) bgColor = "bg-emerald-700";
                    else if (change > 0.5) bgColor = "bg-emerald-800";
                    else if (change > 0) bgColor = "bg-emerald-900/80";

                    // Red Scale
                    else if (change < -3) bgColor = "bg-red-600";
                    else if (change < -1.5) bgColor = "bg-red-700";
                    else if (change < -0.5) bgColor = "bg-red-800";
                    else if (change < 0) bgColor = "bg-red-900/80";

                    return (
                        <div
                            key={item.name}
                            className={`relative group overflow-hidden rounded border border-white/5 hover:border-white/30 hover:z-10 transition-all ${bgColor}`}
                            style={{
                                flexGrow: item.count,
                                flexBasis: `${Math.max(item.count * 15, 80)}px`, // Base width proportional to count
                                height: "30%", // Rows will wrap
                                minHeight: "80px"
                            }}
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                                <span className={`text-[10px] sm:text-xs font-black uppercase leading-tight tracking-wider ${textColor} drop-shadow-md`}>
                                    {item.name}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-white/80 mt-1">
                                    {change > 0 ? "+" : ""}{change.toFixed(2)}%
                                </span>
                                <span className="text-[8px] text-white/40 mt-0.5">
                                    {item.count} Stocks
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

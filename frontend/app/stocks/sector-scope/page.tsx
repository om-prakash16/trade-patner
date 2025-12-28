"use client";

import { useMarketData } from "@/hooks/useMarketData";
import { getSector } from "@/components/sector/sectorData";
import SectorTreemap from "@/components/sector/SectorTreemap";
import SectorBarChart from "@/components/sector/SectorBarChart";
import SectorCard from "@/components/sector/SectorCard";
import { RefreshCw, Info } from "lucide-react";

export default function SectorScopePage() {
    const { data, loading, fetchData } = useMarketData();

    // 1. Group Data by Sector
    const sectors: Record<string, { totalChange: number; count: number; stocks: any[] }> = {};

    data.forEach(stock => {
        const sectorName = getSector(stock.symbol);

        if (!sectors[sectorName]) {
            sectors[sectorName] = { totalChange: 0, count: 0, stocks: [] };
        }

        sectors[sectorName].stocks.push(stock);
        sectors[sectorName].totalChange += stock.change_pct;
        sectors[sectorName].count += 1;
    });

    // 2. Aggregate Data
    const sectorStats = Object.entries(sectors).map(([name, stat]) => ({
        name,
        count: stat.count,
        avgChange: stat.count > 0 ? stat.totalChange / stat.count : 0,
        stocks: stat.stocks.sort((a, b) => b.change_pct - a.change_pct) // Sort stocks by gain inside sector
    })).filter(s => s.name !== "OTHERS"); // Optionally hide "Others" or keep it

    // Sort Sectors by Performance for Cards
    const sortedSectors = [...sectorStats].sort((a, b) => b.avgChange - a.avgChange);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Sector Scope</h1>
                    <p className="text-slate-400">Live sector heatmap and performance analysis.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                        <Info className="w-4 h-4" />
                        How to use
                    </button>
                    <button onClick={() => fetchData()} className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Row 1: Sector Heatmap (Full Width) */}
            <div className="w-full">
                <SectorTreemap sectorData={sectorStats} />
            </div>

            {/* Row 2: Sector Performance (Full Width) */}
            <div className="w-full">
                <SectorBarChart sectorData={sectorStats} />
            </div>

            {/* Row 3: Detailed Sector Cards (2 Columns) */}
            <div className="pt-4">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Detailed Sector Analysis
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedSectors.map(sector => (
                        <div key={sector.name} className="h-[450px]">
                            <SectorCard
                                sector={sector.name}
                                stocks={sector.stocks}
                                avgChange={sector.avgChange}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

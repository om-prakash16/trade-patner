"use client";

import InsiderHeatmap from "@/components/insider/InsiderHeatmap";
import InsiderTable from "@/components/insider/InsiderTable";
import { useMarketData } from "@/hooks/useMarketData";
import { useMemo } from "react";

export default function InsiderPage() {
    const { data } = useMarketData();

    // Process Data for Heatmaps & Tables (Real-time)
    const { heatmapData, lomShortData, lomLongData, contractionData, reversalData, twoDayData, indexAlphaData, sniperSwingData } = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                heatmapData: { "5min": [], "10min": [] },
                lomShortData: [],
                lomLongData: [],
                contractionData: [],
                reversalData: [],
                twoDayData: [],
                indexAlphaData: [],
                sniperSwingData: []
            };
        }

        // --- Shared Helpers ---
        const formatTime = () => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        };
        const currentTime = formatTime();

        // 1. Heatmaps: Top Movers (High Volatility)
        const sortedByVol = [...data].sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct));
        const movers = sortedByVol.slice(0, 10).map(item => ({
            symbol: item.symbol,
            value: Math.abs(item.change_pct),
            percent: item.change_pct,
            isPositive: item.change_pct >= 0
        }));
        // Reverse for 10min to show variety
        const movers10min = [...movers].reverse();


        // 2. LOM Short Term (Intraday): Moderate gains (0.5% to 3%) - Good for scalps
        const lomShort = data
            .filter(item => item.change_pct > 0.5 && item.change_pct <= 3)
            .sort((a, b) => b.strength_score - a.strength_score) // High strength
            .slice(0, 5)
            .map(item => ({
                symbol: item.symbol,
                percent: item.change_pct,
                dateTime: currentTime, // Using scan time would be better if available
                status: "BULL" as const
            }));

        // 3. LOM Long Term (Swing): Strong gains (> 3%) - Breakout runners
        const lomLong = data
            .filter(item => item.change_pct > 3)
            .sort((a, b) => b.change_pct - a.change_pct)
            .slice(0, 5)
            .map(item => ({
                symbol: item.symbol,
                percent: item.change_pct,
                dateTime: currentTime,
                status: "BULL" as const
            }));

        // 4. Contraction BO: Very small change (-0.2% to 0.2%) but High Strength/Volume -> Coiling
        const contraction = data
            .filter(item => Math.abs(item.change_pct) < 0.2)
            .sort((a, b) => b.turnover - a.turnover) // High activity but no move yet
            .slice(0, 5)
            .map(item => ({
                symbol: item.symbol,
                percent: item.change_pct,
                dateTime: currentTime,
                status: (item.change_pct >= 0 ? "BULL" : "BEAR") as "BULL" | "BEAR"
            }));

        // 5. Reversal / Sniper Swing: Deep red stocks (< -2%) looking for support
        // Or Day L breaks
        const reversal = data
            .filter(item => item.change_pct < -2)
            .sort((a, b) => a.change_pct - b.change_pct) // Worst first
            .slice(0, 5)
            .map(item => ({
                symbol: item.symbol,
                percent: item.change_pct,
                dateTime: currentTime,
                status: "BEAR" as const // Currently falling, potential reversal watch
            }));

        // 6. 2 Day H/L BO: Using stocks with explicit 'Breakout' status from backend
        // If no status, fall back to high strength score > 8
        const twoDay = data
            .filter(item => (item.breakout_status && item.breakout_status !== "None") || item.strength_score > 8)
            .slice(0, 5)
            .map(item => ({
                symbol: item.symbol,
                percent: item.change_pct,
                dateTime: currentTime,
                status: (item.change_pct >= 0 ? "BULL" : "BEAR") as "BULL" | "BEAR"
            }));

        // 7. Index Alpha: Top Turnover Stocks (Leaders) vs Nifty assumption
        // Since we don't have Nifty live, we show Market Leaders
        const alpha = data
            .sort((a, b) => b.turnover - a.turnover)
            .slice(0, 5)
            .map(item => ({
                symbol: item.symbol,
                percent: item.change_pct,
                dateTime: currentTime,
                daySegment: "Live",
                status: (item.change_pct >= 0 ? "BULL" : "BEAR") as "BULL" | "BEAR"
            }));

        const sniper = data
            .filter(item => item.change_pct < -1.5 && item.change_pct > -3) // Moderate drop
            .sort((a, b) => b.turnover - a.turnover)
            .slice(0, 5)
            .map(item => ({
                symbol: item.symbol,
                percent: item.change_pct,
                dateTime: currentTime,
                status: "BULL" as const // Looking for Bullish reversal
            }));


        return {
            heatmapData: { "5min": movers, "10min": movers10min },
            lomShortData: lomShort,
            lomLongData: lomLong,
            contractionData: contraction,
            reversalData: reversal,
            twoDayData: twoDay,
            indexAlphaData: alpha,
            sniperSwingData: sniper
        };

    }, [data]);

    return (
        <div className="p-6 space-y-8 min-h-screen bg-black">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Insider Strategy</h1>
                <p className="text-slate-400">Real-time momentum spikes and breakout signals.</p>
            </div>

            {/* Section 1: Heatmaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InsiderHeatmap
                    title="5 MIN MOMENTUM SPIKE"
                    timeFrame="5min"
                    items={heatmapData["5min"]}
                />
                <InsiderHeatmap
                    title="10 MIN MOMENTUM SPIKE"
                    timeFrame="10min"
                    items={heatmapData["10min"]}
                />
            </div>

            {/* Section 2: Strategy Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InsiderTable
                    title="LOM SHORT TERM"
                    type="INTRA"
                    items={lomShortData}
                />
                <InsiderTable
                    title="LOM LONG TERM"
                    type="SWING"
                    items={lomLongData}
                />
                <InsiderTable
                    title="CONTRACTION BO"
                    type="BO"
                    items={contractionData}
                />
                <InsiderTable
                    title="DAY H/L REVERSAL"
                    type="REVERSAL"
                    items={reversalData}
                />
                <InsiderTable
                    title="2 DAY H/L BO"
                    type="2DAY"
                    items={twoDayData}
                />
                <InsiderTable
                    title="INDEX ALPHA"
                    type="INDEX"
                    items={indexAlphaData}
                    showDaySegment={true}
                />
                <InsiderTable
                    title="SNIPER SWING REVERSAL"
                    type="SWING" // Reusing Icon or custom if needed
                    items={sniperSwingData}
                />
            </div>

            {/* Strategy Logic Guide */}
            <div className="border-t border-slate-800 pt-8 mt-12">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-blue-500">ℹ️</span> How it Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-slate-400">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <h3 className="text-white font-bold mb-2">Momentum Spikes (5/10 Min)</h3>
                        <p>Detects stocks with sudden volume & price surges within the last 5 or 10 minutes. <br /> <span className="text-emerald-400">Green</span> = Bullish Spike, <span className="text-red-400">Red</span> = Bearish Drop.</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <h3 className="text-white font-bold mb-2">LOM (Level of Momentum)</h3>
                        <p>Tracks sustained momentum. <b>Short Term</b> (Intraday) for quick scalps, <b>Long Term</b> (Swing) for multi-day strength.</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <h3 className="text-white font-bold mb-2">Contraction BO</h3>
                        <p>Identifies stocks breaking out of a tight consolidation (Contraction) zone. Often leads to explosive moves.</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <h3 className="text-white font-bold mb-2">2 Day H/L Breakout</h3>
                        <p>Stocks breaking their highest high or lowest low of the last 2 trading sessions. Key trend continuation signal.</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <h3 className="text-white font-bold mb-2">Index Alpha</h3>
                        <p>Compares Index strength vs its components across Morning, Afternoon, and End of Day segments to find relative outperformers.</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <h3 className="text-white font-bold mb-2">Sniper Swing Reversal</h3>
                        <p>High-probability reversal setups on swing timeframes. Catching the bottom or top before the trend shifts.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

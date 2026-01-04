"use client";

import MarketNav from "@/components/market-plus/MarketNav";

export default function MarketLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <main className="min-h-screen p-6 md:p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">MarketPlus <span className="text-orange-500">Scanner</span></h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Advanced Multi-Timeframe Breakout Detection</p>
            </div>

            <MarketNav />

            {children}
        </main>
    );
}

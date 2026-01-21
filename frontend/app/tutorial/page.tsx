"use client";

import { BookOpen, Activity, Zap, TrendingUp, Clock, TrendingDown } from "lucide-react";

export default function TutorialPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-slate-100 font-sans selection:bg-purple-500/30">
            {/* Header */}
            <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                            <BookOpen className="w-6 h-6 text-purple-400" />
                        </span>
                        NGTA User Guide
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 ml-11">
                        How to navigate and master the NGTA Trading Dashboard.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">

                {/* Section 1: Introduction */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Welcome to NGTA</h2>
                    <p className="text-slate-400 leading-relaxed mb-6">
                        NGTA (Next Gen Trading Assistant) is a powerful, real-time scanner designed to help you identify high-probability trading setups in the Indian Stock Market (NSE). It combines technical analysis, breakout detection, and momentum tracking into a single, easy-to-use interface.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                        <FeatureCard
                            icon={<Zap className="w-5 h-5 text-yellow-400" />}
                            title="Real-Time Data"
                            desc="Live prices and calculations updated instantly."
                        />
                        <FeatureCard
                            icon={<Activity className="w-5 h-5 text-blue-400" />}
                            title="Smart Scanners"
                            desc="Automated breakdown of 200+ F&O stocks."
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                            title="Breakout Alerts"
                            desc="Catch trends before they happen."
                        />
                    </div>
                </section>

                <hr className="border-slate-800" />

                {/* Section 2: Scanners */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold text-white">Understanding the Scanners</h2>

                    {/* Swing Spectrum */}
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-emerald-400 flex items-center gap-2">
                            <Activity className="w-5 h-5" /> Swing Spectrum (Swing Trading)
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Best for finding stocks trending over multiple days. It analyzes Daily Candles.
                        </p>
                        <ul className="list-disc list-inside text-slate-500 text-sm space-y-1 ml-2">
                            <li><strong>Trend:</strong> Shows if the stock is Up or Down based on Moving Averages (20/50/200 DMA).</li>
                            <li><strong>Bias:</strong> "Bullish" means price &gt; 20 EMA. "Bearish" means price &lt; 20 EMA.</li>
                            <li><strong>Consolidation:</strong> Highlights stocks that are squeezing (Bollinger Bands) and ready for a move.</li>
                        </ul>
                    </div>

                    {/* MACD Scanner */}
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
                            <Clock className="w-5 h-5" /> MACD Squeeze Scanner (Intraday Bullish)
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Designed to catch quiet momentum buildup during the dull market hours (12:00 PM - 02:25 PM).
                        </p>
                        <ul className="list-disc list-inside text-slate-500 text-sm space-y-1 ml-2">
                            <li><strong>Logic:</strong> Tracks MACD movement specifically between 12:00 and 02:25 PM.</li>
                            <li><strong>Goal:</strong> Find stocks where MACD is stable/flat (Change 0.0 to 0.5) but showing signs of growing bullishness.</li>
                            <li><strong>Yesterday's Δ:</strong> Shows yesterday's movement in the same window. Use the "Yest Squeeze (0.1-1.0)" filter to find proven movers.</li>
                        </ul>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm text-blue-300">
                            <strong>Tip:</strong> Look for stocks with "0-0.3 Change" (Squeeze) and "Bullish" Direction. These often explode after 2:30 PM.
                        </div>
                    </div>

                    {/* Bearish MACD */}
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-red-400 flex items-center gap-2">
                            <TrendingDown className="w-5 h-5" /> Bearish MACD Scanner (Intraday Short)
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Opposite of the MACD Scanner. Finds shorting opportunities between <strong>10:10 AM - 02:10 PM</strong>.
                        </p>
                        <ul className="list-disc list-inside text-slate-500 text-sm space-y-1 ml-2">
                            <li><strong>Criteria:</strong> Looks for confirmed negative MACD divergence (-0.01 to -0.2).</li>
                            <li><strong>Use Case:</strong> Perfect for identifying stocks that are weak and likely to slide further during the day.</li>
                        </ul>
                    </div>
                </section>

                <hr className="border-slate-800" />

                {/* Section 3: Pro Tools */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Pro Tools</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl">
                            <h4 className="font-semibold text-white mb-2">Pro Analytics</h4>
                            <p className="text-sm text-slate-400">
                                The "God Mode" table. See everything at once: RSI, MACD, Volume Breakouts, and Option Chain data (PCR, IV) in one sortable view.
                            </p>
                        </div>
                        <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl">
                            <h4 className="font-semibold text-white mb-2">Find Stock</h4>
                            <p className="text-sm text-slate-400">
                                Deep dive into a single stock. Shows 1-Year charts, Support/Resistance levels, and detailed performance metrics.
                            </p>
                        </div>
                    </div>
                </section>

                <hr className="border-slate-800" />

                {/* Section 4: DATA KEY (How to Read) */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">How to Read the Data</h2>
                    <div className="overflow-hidden rounded-xl border border-slate-800">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900 uppercase font-medium text-slate-300">
                                <tr>
                                    <th className="px-6 py-4">Column</th>
                                    <th className="px-6 py-4">Meaning</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                                <tr>
                                    <td className="px-6 py-4 font-mono text-white">LTP</td>
                                    <td className="px-6 py-4">Last Traded Price (Live - Updated every few seconds).</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-mono text-white">Change %</td>
                                    <td className="px-6 py-4">Percentage move from yesterday's close.</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-mono text-white">MACD Div</td>
                                    <td className="px-6 py-4">The difference between MACD and Signal Line. <br /> <span className="text-emerald-400">Positive</span> = Bullish, <span className="text-red-400">Negative</span> = Bearish.</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-mono text-white">Yesterday Δ</td>
                                    <td className="px-6 py-4">How much the MACD changed during the <strong>same time window yesterday</strong>. Used to confirm pattern consistency.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <hr className="border-slate-800" />

                {/* Section 5: TRADING RULES */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Trading Cheat Sheet</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Bullish Setup */}
                        <div className="p-6 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 font-bold">Buy</span>
                                <h3 className="text-lg font-bold text-white">MACD Bullish Breakout</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex gap-2">
                                    <span className="text-emerald-500">✔</span>
                                    <span>Time: After <strong>02:00 PM</strong></span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-500">✔</span>
                                    <span>MACD Change: <strong>0.1 to 0.3</strong> (Rising slowly)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-500">✔</span>
                                    <span>Trend: <strong>Bullish</strong> (Green Tag)</span>
                                </li>
                            </ul>
                        </div>

                        {/* Bearish Setup */}
                        <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-red-500/20 rounded-lg text-red-400 font-bold">Sell</span>
                                <h3 className="text-lg font-bold text-white">Bearish MACD breakdown</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex gap-2">
                                    <span className="text-red-500">✔</span>
                                    <span>Time: Any time between <strong>10:10 AM - 02:00 PM</strong></span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-red-500">✔</span>
                                    <span>MACD Change: <strong>-0.1 to -0.2</strong> (Dropping)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-red-500">✔</span>
                                    <span>Yesterday Δ: Also Negative (Preferable)</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-4">
                    <Zap className="w-6 h-6 text-emerald-500 mt-1" />
                    <div>
                        <h4 className="text-emerald-400 font-bold mb-1">Ready to start?</h4>
                        <p className="text-slate-400 text-sm">
                            Click on <strong>"Dashboard"</strong> or select a scanner from the sidebar to begin your analysis. Happy Trading!
                        </p>
                    </div>
                </div>

            </div>
        </main>
    )
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
            <div className="mb-3">{icon}</div>
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-xs text-slate-400">{desc}</p>
        </div>
    )
}

"use client";

import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, ExternalLink, Sunrise, TrendingUp, TrendingDown, Target } from "lucide-react";

interface PreMarketData {
    gainers: any[];
    losers: any[];
    breakout_watch: any[];
    strength_buyers: any[];
    strength_sellers: any[];
}

export default function PreMarketPage() {
    const [data, setData] = useState<PreMarketData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/pre-market");
                if (res.ok) {
                    const json = await res.json();
                    if (!json.status) { // If not "empty" status
                        setData(json);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch pre-market data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-slate-500 animate-pulse">Loading Pre-Market Insights...</div>;
    if (!data) return <div className="text-slate-500">No Pre-Market Data Available. (Check if Scanner ran for previous session)</div>;

    const SectionHeader = ({ title, icon: Icon, color }: any) => (
        <div className="flex items-center gap-2 mb-4">
            <div className={`p-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">{title}</h2>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Banner */}
            <div className="bg-gradient-to-r from-slate-100 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm dark:shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-full">
                        <Sunrise className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pre-Market Insights</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Actionable data from the last completed trading session. Use this to prepare your watchlist.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Gainers */}
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
                    <SectionHeader title="Top Gainers (Last Close)" icon={TrendingUp} color="text-green-600 dark:text-green-500" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-4 py-3">Symbol</th>
                                    <th className="px-4 py-3 text-right">LTP</th>
                                    <th className="px-4 py-3 text-right">Change %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {data.gainers.slice(0, 10).map((item: any) => (
                                    <tr key={item.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.symbol}</td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.ltp}</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-500">+{item.change_pct}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Losers */}
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
                    <SectionHeader title="Top Losers (Last Close)" icon={TrendingDown} color="text-red-600 dark:text-red-500" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-4 py-3">Symbol</th>
                                    <th className="px-4 py-3 text-right">LTP</th>
                                    <th className="px-4 py-3 text-right">Change %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {data.losers.slice(0, 10).map((item: any) => (
                                    <tr key={item.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.symbol}</td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.ltp}</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-500">{item.change_pct}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 3. Breakout Watch */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
                <SectionHeader title="Breakout Watchlist (Close to Level)" icon={Target} color="text-blue-600 dark:text-blue-500" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-4 py-3">Symbol</th>
                                <th className="px-4 py-3">Breakout Type</th>
                                <th className="px-4 py-3 text-right">Level</th>
                                <th className="px-4 py-3 text-right">LTP</th>
                                <th className="px-4 py-3 text-right">Distance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {data.breakout_watch.length > 0 ? data.breakout_watch.map((item: any) => (
                                <tr key={item.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.symbol}</td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-wider">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{item.breakout_type}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{item.breakout_level}</td>
                                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-bold">{item.ltp}</td>
                                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400 font-bold">{item.distance_pct}%</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No stocks near breakout levels found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 4. Strength Buyers */}
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
                    <SectionHeader title="Strong Buyers (3D Avg)" icon={ArrowUp} color="text-green-600 dark:text-green-500" />
                    {/* Reuse table structure simplified */}
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-4 py-3">Symbol</th>
                                <th className="px-4 py-3 text-right">3D Avg %</th>
                                <th className="px-4 py-3 text-right">Last %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {data.strength_buyers.map((item: any) => (
                                <tr key={item.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.symbol}</td>
                                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-bold">+{item.avg_3d}%</td>
                                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{item.change_pct}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 5. Strength Sellers */}
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
                    <SectionHeader title="Strong Sellers (3D Avg)" icon={ArrowDown} color="text-red-600 dark:text-red-500" />
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-4 py-3">Symbol</th>
                                <th className="px-4 py-3 text-right">3D Avg %</th>
                                <th className="px-4 py-3 text-right">Last %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {data.strength_sellers.map((item: any) => (
                                <tr key={item.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.symbol}</td>
                                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 font-bold">{item.avg_3d}%</td>
                                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{item.change_pct}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

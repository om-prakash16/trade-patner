"use client";

import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, ExternalLink, Sunrise, TrendingUp, TrendingDown, Target, ArrowUpDown } from "lucide-react";

interface PreMarketData {
    gainers: any[];
    losers: any[];
    breakout_watch: any[];
    strength_buyers: any[];
    strength_sellers: any[];
}

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc' | null;
}

const SortableTable = ({ data, columns, title, icon: Icon, color }: any) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null;
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) return data;

        return [...data].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle numeric values (remove % or commas if present)
            if (typeof aValue === 'string') {
                aValue = parseFloat(aValue.replace(/,/g, '').replace('%', ''));
            }
            if (typeof bValue === 'string') {
                bValue = parseFloat(bValue.replace(/,/g, '').replace('%', ''));
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">{title}</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            {columns.map((col: any) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 ${col.align === 'right' ? 'text-right' : ''}`}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                                        {col.label}
                                        {col.sortable && (
                                            <span className="text-slate-400">
                                                {sortConfig.key === col.key ? (
                                                    sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                ) : (
                                                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {sortedData.length > 0 ? sortedData.map((item: any) => (
                            <tr key={item.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                {columns.map((col: any) => (
                                    <td key={`${item.symbol}-${col.key}`} className={`px-4 py-3 ${col.className || ''} ${col.align === 'right' ? 'text-right' : ''}`}>
                                        {col.render ? col.render(item[col.key], item) : item[col.key]}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">No data available.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

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

    const commonColumns = [
        { key: 'symbol', label: 'Symbol', sortable: false, className: 'font-medium text-slate-900 dark:text-white' },
        { key: 'ltp', label: 'LTP', sortable: true, align: 'right', className: 'text-slate-600 dark:text-slate-300' },
        { key: 'change_pct', label: 'Change %', sortable: true, align: 'right', render: (val: any) => <span className={parseFloat(val) >= 0 ? 'text-green-600 dark:text-green-500 font-bold' : 'text-red-600 dark:text-red-500 font-bold'}>{val > 0 ? '+' : ''}{val}%</span> }
    ];

    const breakoutColumns = [
        { key: 'symbol', label: 'Symbol', sortable: false, className: 'font-medium text-slate-900 dark:text-white' },
        { key: 'breakout_type', label: 'Breakout Type', sortable: true, render: (val: any) => <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-wider">{val}</span> },
        { key: 'breakout_level', label: 'Level', sortable: true, align: 'right', className: 'text-slate-500 dark:text-slate-400' },
        { key: 'ltp', label: 'LTP', sortable: true, align: 'right', className: 'text-slate-900 dark:text-white font-bold' },
        { key: 'distance_pct', label: 'Distance', sortable: true, align: 'right', className: 'text-blue-600 dark:text-blue-400 font-bold', render: (val: any) => `${val}%` }
    ];

    const strengthColumnsBuyer = [
        { key: 'symbol', label: 'Symbol', sortable: false, className: 'font-medium text-slate-900 dark:text-white' },
        { key: 'avg_3d', label: '3D Avg %', sortable: true, align: 'right', className: 'text-green-600 dark:text-green-400 font-bold', render: (val: any) => `+${val}%` },
        { key: 'change_pct', label: 'Last %', sortable: true, align: 'right', className: 'text-slate-500 dark:text-slate-400', render: (val: any) => `${val}%` }
    ];

    const strengthColumnsSeller = [
        { key: 'symbol', label: 'Symbol', sortable: false, className: 'font-medium text-slate-900 dark:text-white' },
        { key: 'avg_3d', label: '3D Avg %', sortable: true, align: 'right', className: 'text-red-600 dark:text-red-400 font-bold', render: (val: any) => `${val}%` },
        { key: 'change_pct', label: 'Last %', sortable: true, align: 'right', className: 'text-slate-500 dark:text-slate-400', render: (val: any) => `${val}%` }
    ];


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
                <SortableTable
                    title="Top Gainers (Last Close)"
                    icon={TrendingUp}
                    color="text-green-600 dark:text-green-500"
                    data={data.gainers.slice(0, 10)}
                    columns={commonColumns}
                />

                {/* 2. Losers */}
                <SortableTable
                    title="Top Losers (Last Close)"
                    icon={TrendingDown}
                    color="text-red-600 dark:text-red-500"
                    data={data.losers.slice(0, 10)}
                    columns={commonColumns}
                />
            </div>

            {/* 3. Breakout Watch */}
            <SortableTable
                title="Breakout Watchlist (Close to Level)"
                icon={Target}
                color="text-blue-600 dark:text-blue-500"
                data={data.breakout_watch}
                columns={breakoutColumns}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 4. Strength Buyers */}
                <SortableTable
                    title="Strong Buyers (3D Avg)"
                    icon={ArrowUp}
                    color="text-green-600 dark:text-green-500"
                    data={data.strength_buyers}
                    columns={strengthColumnsBuyer}
                />

                {/* 5. Strength Sellers */}
                <SortableTable
                    title="Strong Sellers (3D Avg)"
                    icon={ArrowDown}
                    color="text-red-600 dark:text-red-500"
                    data={data.strength_sellers}
                    columns={strengthColumnsSeller}
                />
            </div>
        </div>
    );
}

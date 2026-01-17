"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    ArrowRight, Search, Zap, Clock, TrendingUp, TrendingDown, Minus, Activity, Sliders, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { ColumnHeader, NumericFilter, CategoryFilter } from "@/components/TableFilters";
import { useMemo } from "react";

export default function MACDScannerPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [rangeFilter, setRangeFilter] = useState("ALL"); // ALL, 0-0.3, 0.3-0.6, 0.6-1.0
    const [dirFilter, setDirFilter] = useState("ALL"); // ALL, Bullish, Bearish
    const API_URL = "http://localhost:8000";

    useEffect(() => {
        fetchMACDStocks();
    }, []);

    const fetchMACDStocks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/strategies/macd`);
            if (res.data.status === "success") {
                setData(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch macd stocks", err);
        } finally {
            setLoading(false);
        }
    };

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
        key: 'macd_change',
        direction: 'asc'
    });

    // Column Filters State
    const [colFilters, setColFilters] = useState<Record<string, any>>({});

    // Helper to update filters
    const updateFilter = (field: string, value: any) => {
        setColFilters(prev => {
            const newFilters = { ...prev, [field]: value };
            if (!value) delete newFilters[field]; // Cleanup empty filters
            return newFilters;
        });
    };

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' };
        });
    };

    const filteredData = useMemo(() => {
        let res = [...data];

        // 1. Search
        if (searchTerm) {
            res = res.filter(item => item.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // 2. Range Filter (Global)
        if (rangeFilter !== "ALL") {
            res = res.filter(item => {
                const change = parseFloat(item.macd_change);
                const yest_change = parseFloat(item.yest_change);

                if (rangeFilter === "Yest Squeeze (0.1-1.0)") return yest_change >= 0.1 && yest_change <= 1.0;

                if (rangeFilter === "0-0.3") return change >= 0 && change <= 0.3;
                if (rangeFilter === "0.3-0.6") return change > 0.3 && change <= 0.6;
                if (rangeFilter === "0.6-1.0") return change > 0.6 && change <= 1.0;
                if (rangeFilter === "Wide (> 1.0)") return change > 1.0;
                return true;
            });
        }

        // 3. Direction Filter (Global)
        if (dirFilter !== "ALL") {
            res = res.filter(item => item.direction === dirFilter);
        }

        // 4. Column Filters (Pro Style)
        Object.entries(colFilters).forEach(([field, criteria]) => {
            if (!criteria) return;
            res = res.filter(item => {
                if (criteria.type === 'range') {
                    const val = parseFloat(item[field]);
                    if (isNaN(val)) return false;
                    const min = criteria.min !== '' ? parseFloat(criteria.min) : -Infinity;
                    const max = criteria.max !== '' ? parseFloat(criteria.max) : Infinity;
                    return val >= min && val <= max;
                }
                if (criteria.type === 'category') {
                    if (criteria.selected.length === 0) return true;
                    return criteria.selected.includes(item[field]);
                }
                return true;
            });
        });

        // 5. Sorting
        if (sortConfig.key) {
            res.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle numbers
                const aNum = parseFloat(aValue);
                const bNum = parseFloat(bValue);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    aValue = aNum;
                    bValue = bNum;
                } else {
                    // String sort
                    aValue = aValue ? aValue.toString().toLowerCase() : '';
                    bValue = bValue ? bValue.toString().toLowerCase() : '';
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return res;
    }, [data, searchTerm, rangeFilter, dirFilter, colFilters, sortConfig]);

    // Stats
    // const bullishCount = data.filter(d => d.direction === "Bullish").length;

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-slate-100 font-sans selection:bg-blue-500/30">

            {/* Header */}
            <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <span className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                                    <Activity className="w-6 h-6 text-blue-400" />
                                </span>
                                MACD Squeeze Scanner
                            </h1>
                            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Detecting quiet momentum buildup between 12:00 PM - 02:25 PM
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {!loading && (
                                <div className="text-xs text-slate-500 font-mono">
                                    Scanned {data.length} Results
                                </div>
                            )}
                            <button
                                onClick={fetchMACDStocks}
                                disabled={loading}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all disabled:opacity-50 text-sm font-medium"
                            >
                                {loading ? 'Scanning...' : 'Refresh Scan'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">

                    <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                        {/* Search */}
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search symbol..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 w-full transition-all"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {/* Range Filters */}
                            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                                {['ALL', '0-0.3', '0.3-0.6', '0.6-1.0', 'Wide (> 1.0)', 'Yest Squeeze (0.1-1.0)'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRangeFilter(r)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${rangeFilter === r
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {r === 'ALL' ? 'Any Range' : r}
                                    </button>
                                ))}
                            </div>

                            {/* Direction Filters */}
                            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                                {['ALL', 'Bullish', 'Bearish', 'Flat'].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDirFilter(d)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${dirFilter === d
                                            ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                                            : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {d === 'ALL' ? 'Any Dir' : d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table / Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <div className="text-slate-500 text-sm animate-pulse">Running INTRA-DAY analysis on 200+ F&O stocks...</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-medium">
                                    <ColumnHeader
                                        title="Symbol" field="symbol" type="text"
                                        sortField="symbol" currentSort={sortConfig} onSort={handleSort}
                                    />
                                    <ColumnHeader
                                        title="LTP" field="ltp" type="numeric"
                                        sortField="ltp" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['ltp']}
                                        onClear={() => updateFilter('ltp', null)}
                                        filterContent={<NumericFilter min={colFilters['ltp']?.min || ''} max={colFilters['ltp']?.max || ''} setMin={v => updateFilter('ltp', { ...colFilters['ltp'], type: 'range', min: v })} setMax={v => updateFilter('ltp', { ...colFilters['ltp'], type: 'range', max: v })} />}
                                    />
                                    <ColumnHeader
                                        title="Start (12:00)" field="macd_start" type="numeric"
                                        sortField="macd_start" currentSort={sortConfig} onSort={handleSort}
                                    />
                                    <ColumnHeader
                                        title="End (02:25)" field="macd_end" type="numeric"
                                        sortField="macd_end" currentSort={sortConfig} onSort={handleSort}
                                    />
                                    <ColumnHeader
                                        title="Change (Δ)" field="macd_change" type="numeric"
                                        sortField="macd_change" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['macd_change']}
                                        onClear={() => updateFilter('macd_change', null)}
                                        filterContent={<NumericFilter min={colFilters['macd_change']?.min || ''} max={colFilters['macd_change']?.max || ''} setMin={v => updateFilter('macd_change', { ...colFilters['macd_change'], type: 'range', min: v })} setMax={v => updateFilter('macd_change', { ...colFilters['macd_change'], type: 'range', max: v })} />}
                                    />
                                    <ColumnHeader
                                        title="Yesterday's Δ" field="yest_change" type="numeric"
                                        sortField="yest_change" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['yest_change']}
                                        onClear={() => updateFilter('yest_change', null)}
                                        filterContent={<NumericFilter min={colFilters['yest_change']?.min || ''} max={colFilters['yest_change']?.max || ''} setMin={v => updateFilter('yest_change', { ...colFilters['yest_change'], type: 'range', min: v })} setMax={v => updateFilter('yest_change', { ...colFilters['yest_change'], type: 'range', max: v })} />}
                                    />
                                    <ColumnHeader
                                        title="Direction" field="direction" type="category"
                                        sortField="direction" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['direction']}
                                        onClear={() => updateFilter('direction', null)}
                                        filterContent={<CategoryFilter options={["Bullish", "Bearish", "Flat"]} selected={colFilters['direction']?.selected || []} onChange={sel => updateFilter('direction', { type: 'category', selected: sel })} />}
                                    />
                                    <ColumnHeader
                                        title="Status" field="status" type="category"
                                        sortField="status" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['status']}
                                        onClear={() => updateFilter('status', null)}
                                        filterContent={<CategoryFilter options={["Increasing", "Decreasing", "Stable"]} selected={colFilters['status']?.selected || []} onChange={sel => updateFilter('status', { type: 'category', selected: sel })} />}
                                    />
                                    <th className="p-4 pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredData.map((stock) => (
                                    <tr key={stock.token} className="group hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 pl-6 font-medium text-white group-hover:text-blue-300 transition-colors">
                                            {stock.symbol}
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">NSE-EQ</div>
                                        </td>

                                        <td className="p-4 font-mono text-slate-300">
                                            ₹{stock.ltp.toLocaleString('en-IN')}
                                        </td>

                                        <td className="p-4 font-mono text-slate-400 text-xs">
                                            {stock.macd_start}
                                        </td>

                                        <td className="p-4 font-mono text-slate-400 text-xs">
                                            {stock.macd_end}
                                        </td>

                                        <td className="p-4">
                                            <div className="font-mono text-sm text-white font-bold">
                                                {stock.macd_change}
                                            </div>
                                        </td>

                                        <td className="p-4 font-mono text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${parseFloat(stock.yest_change) >= 0.1 && parseFloat(stock.yest_change) <= 1.0
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'text-slate-500'
                                                }`}>
                                                {stock.yest_change}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <DirectionBadge dir={stock.direction} />
                                        </td>

                                        <td className="p-4">
                                            <StatusBadge status={stock.status} />
                                        </td>

                                        <td className="p-4 pr-6">
                                            <button className="text-xs font-medium text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 px-3 py-1.5 rounded transition-all flex items-center gap-1">
                                                Analyze <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredData.length === 0 && (
                            <div className="p-12 text-center text-slate-500">
                                No stocks found matching the criteria.
                            </div>
                        )}
                    </div>
                )}

            </div>
        </main>
    );
}

// Stats Components

function DirectionBadge({ dir }: { dir: string }) {
    if (dir === "Bullish") {
        return <span className="text-xs font-medium text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Bullish</span>
    }
    if (dir === "Bearish") {
        return <span className="text-xs font-medium text-red-400 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Bearish</span>
    }
    return <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Minus className="w-3 h-3" /> Flat</span>
}

function StatusBadge({ status }: { status: string }) {
    let color = "bg-slate-800 text-slate-400";
    if (status === "Increasing") color = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
    if (status === "Decreasing") color = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    if (status === "Stable") color = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${color}`}>
            {status}
        </span>
    )
}

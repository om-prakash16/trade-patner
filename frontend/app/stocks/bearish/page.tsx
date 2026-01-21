"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
    ArrowRight, Search, Activity, Clock, TrendingUp, TrendingDown, Minus
} from "lucide-react";
import { ColumnHeader, NumericFilter, CategoryFilter } from "@/components/TableFilters";

export default function BearishMACDPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [rangeFilter, setRangeFilter] = useState("ALL");
    const [dirFilter, setDirFilter] = useState("ALL");
    const API_URL = "http://localhost:8000";

    useEffect(() => {
        fetchBearishStocks();
    }, []);

    const fetchBearishStocks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/strategies/bearish-macd`);
            if (res.data.status === "success") {
                setData(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch bearish macd data", err);
        } finally {
            setLoading(false);
        }
    };

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
        key: 'macd_change',
        direction: 'asc' // Show most negative first usually
    });

    // Column Filters State
    const [colFilters, setColFilters] = useState<Record<string, any>>({});

    const updateFilter = (field: string, value: any) => {
        setColFilters(prev => {
            const newFilters = { ...prev, [field]: value };
            if (!value) delete newFilters[field];
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

        // 2. Col Filters
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

        // 3. Sorting
        if (sortConfig.key) {
            res.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                const aNum = parseFloat(aValue);
                const bNum = parseFloat(bValue);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    aValue = aNum;
                    bValue = bNum;
                } else {
                    aValue = aValue ? aValue.toString().toLowerCase() : '';
                    bValue = bValue ? bValue.toString().toLowerCase() : '';
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return res;
    }, [data, searchTerm, colFilters, sortConfig]);

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-slate-100 font-sans selection:bg-red-500/30">

            {/* Header */}
            <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <span className="bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                    <TrendingDown className="w-6 h-6 text-red-500" />
                                </span>
                                Bearish MACD Scanner
                            </h1>
                            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Monitoring Bearish entries from 10:10 AM - 02:10 PM
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {!loading && (
                                <div className="text-xs text-slate-500 font-mono">
                                    Found {data.length} Results
                                </div>
                            )}
                            <button
                                onClick={fetchBearishStocks}
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
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search symbol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 w-full transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                        <div className="text-slate-500 text-sm animate-pulse">Scanning for Bearish Confirmations...</div>
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
                                        title="Start (10:10)" field="macd_start" type="numeric"
                                        sortField="macd_start" currentSort={sortConfig} onSort={handleSort}
                                    />
                                    <ColumnHeader
                                        title="End (14:10)" field="macd_end" type="numeric"
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
                                    />
                                    <th className="p-4">Direction</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredData.map((stock) => (
                                    <tr key={stock.token} className="group hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 pl-6 font-medium text-white group-hover:text-red-300 transition-colors">
                                            {stock.symbol}
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
                                            <div className="font-mono text-sm text-red-400 font-bold">
                                                {stock.macd_change}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-slate-500 text-xs">
                                            {stock.yest_change}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                                                <TrendingDown className="w-3 h-3" /> Bearish
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredData.length === 0 && (
                            <div className="p-12 text-center text-slate-500">
                                No Bearish setups found in the -0.01 to -0.2 range.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

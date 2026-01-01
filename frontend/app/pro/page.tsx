"use client";

import { useState, useMemo } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { Filter, ArrowUpDown, Brain, TrendingUp, TrendingDown, Minus, Activity, ArrowUp, ArrowDown, X, SlidersHorizontal, HelpCircle } from "lucide-react";
import { ColumnHeader, NumericFilter, CategoryFilter } from "@/components/TableFilters";
import { useSidebar } from "@/context/SidebarContext";

export default function ProScannerPage() {
    const { data: rawData, loading } = useMarketData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = rawData as any[]; // Access dynamic backend fields
    const [showFilters, setShowFilters] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");

    // Filters
    const [filterShorting, setFilterShorting] = useState(false);
    const [filterSignals, setFilterSignals] = useState(false);

    // Multi-Column Filters
    // Store min/max for numbers, specific values for strings
    const [filters, setFilters] = useState<{ [key: string]: { min?: string, max?: string, value?: string } }>({
        change_current: { min: "", max: "" },
        change_1d: { min: "", max: "" },
        change_2d: { min: "", max: "" },
        change_3d: { min: "", max: "" },
        avg_3d: { min: "", max: "" },
        rsi: { min: "", max: "" },
        strength_score: { min: "", max: "" },
        dom_1d: { value: "All" },
        dom_2d: { value: "All" },
        dom_3d: { value: "All" },
        macd_signal: { value: "All" }
    });

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc', mode: 'standard' | 'absolute' }>({
        key: 'avg_3d',
        direction: 'asc',
        mode: 'absolute' // Default: Closest to 0
    });

    // Handler for Column Header Clicks
    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current.key === key) {
                if (current.mode === 'absolute') {
                    return { key, direction: 'asc', mode: 'standard' };
                }
                return {
                    key,
                    direction: current.direction === 'asc' ? 'desc' : 'asc',
                    mode: 'standard'
                };
            }
            return { key, direction: 'desc', mode: 'standard' };
        });
    };

    // Handler for Filter Inputs
    const handleFilterChange = (key: string, type: 'min' | 'max' | 'value', value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: { ...prev[key], [type]: value }
        }));
    };

    const clearFilters = () => {
        setFilters({
            change_current: { min: "", max: "" },
            change_1d: { min: "", max: "" },
            change_2d: { min: "", max: "" },
            change_3d: { min: "", max: "" },
            avg_3d: { min: "", max: "" },
            rsi: { min: "", max: "" },
            strength_score: { min: "", max: "" },
            dom_1d: { value: "All" },
            dom_2d: { value: "All" },
            dom_3d: { value: "All" },
            macd_signal: { value: "All" }
        });
        setFilterShorting(false);
        setFilterSignals(false);
        setSearchQuery("");
    };

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

    // Advanced Filtering & Sorting Logic
    const processedData = useMemo(() => {
        let res = [...data];

        // 0. Search Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            res = res.filter(item =>
                item.symbol.toLowerCase().includes(lowerQuery)
            );
        }

        // 1. Global Filters (Legacy - if mapped)
        if (filterShorting) {
            res = res.filter(item => item.dom_current === "Sellers" || item.change_pct < 0);
        }
        if (filterSignals) {
            // ... (keep existing signal logic if needed, or remove if migrated)
            res = res.filter(item => {
                const significantRSI = item.rsi < 40 || item.rsi > 60;
                const significantMACD = item.macd_signal && item.macd_signal !== "Neutral";
                return significantRSI && significantMACD;
            });
        }

        // 2. Col Logic
        Object.keys(filters).forEach(key => {
            // Legacy filters from the advanced panel - keeping for compatibility if user opens panel
            // ...
        });

        // 3. New Column Filters Logic
        Object.entries(colFilters).forEach(([field, criteria]) => {
            if (!criteria) return;

            res = res.filter(item => {
                // Numeric Range
                if (criteria.type === 'range') {
                    const val = parseFloat(item[field]);
                    if (isNaN(val)) return false;
                    const min = criteria.min !== '' ? parseFloat(criteria.min) : -Infinity;
                    const max = criteria.max !== '' ? parseFloat(criteria.max) : Infinity;
                    return val >= min && val <= max;
                }
                // Category (Multi-select)
                if (criteria.type === 'category') {
                    if (criteria.selected.length === 0) return true;
                    let val = item[field];
                    // Special case for DOM which might be string "Buyers"
                    if (field.startsWith('dom_')) return criteria.selected.includes(val);
                    if (field === 'macd_signal') return criteria.selected.includes(val);
                    return criteria.selected.includes(val);
                }
                return true;
            });
        });

        // 4. Sorting
        if (sortConfig.key) {
            res.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;

                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return res;
    }, [data, searchQuery, sortConfig, filters, colFilters, filterShorting, filterSignals]);


    const getDomColor = (dom: string) => {
        if (!dom) return "text-slate-400 bg-slate-900/30";
        if (dom === "Buyers") return "text-emerald-400 bg-emerald-950/30 border-emerald-500/20";
        if (dom === "Sellers") return "text-red-400 bg-red-950/30 border-red-500/20";
        if (dom === "Balance") return "text-yellow-400 bg-yellow-950/30 border-yellow-500/20";
        return "text-slate-400 bg-slate-900/30";
    };

    const renderSortIcon = (columnKey: string) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-2 h-2 opacity-30" />;
        if (sortConfig.mode === 'absolute') return <Minus className="w-2 h-2 text-orange-400" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-2 h-2 text-blue-400" /> : <ArrowDown className="w-2 h-2 text-blue-400" />;
    };

    // Helper to check if any specific range filter is active
    const activeFilterCount = Object.values(filters).reduce((acc, curr) => {
        if (curr.min && curr.min !== "") return acc + 1;
        if (curr.max && curr.max !== "") return acc + 1;
        if (curr.value && curr.value !== "All") return acc + 1;
        return acc;
    }, 0);

    return (
        <main className="min-h-screen bg-[#050505] text-slate-200 font-sans p-2">
            <div className="max-w-[1920px] mx-auto space-y-2">

                {/* Header & Controls - Compact */}
                <div className="bg-slate-900/50 p-2 md:p-3 rounded-xl border border-slate-800 backdrop-blur-md">
                    <div className="flex flex-col xl:flex-row gap-3 items-center justify-between">
                        {/* 1. Title & Search */}
                        <div className="flex items-center gap-4 flex-1 w-full xl:w-auto">


                            <h1 className="text-xl font-bold text-white flex items-center gap-2 whitespace-nowrap">
                                <Brain className="text-orange-500 w-5 h-5" />
                                Pro <span className="text-slate-500 font-normal hidden sm:inline">Scanner</span>
                            </h1>

                            {/* Search Bar */}
                            <div className="relative w-full max-w-xs group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-500 group-focus-within:text-blue-400">🔍</span>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-9 pr-3 py-1.5 border border-slate-700 rounded-lg leading-5 bg-slate-950/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 sm:text-sm transition-all"
                                    placeholder="Search Symbol..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 2. Primary Filters (Shorting, Signals, etc) */}
                        <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 no-scrollbar">


                            {/* Smart Signals */}
                            <button
                                onClick={() => setFilterSignals(!filterSignals)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${filterSignals ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <Activity className="w-3.5 h-3.5" />
                                {filterSignals ? "Signals ON" : "Signals"}
                            </button>

                            {/* Shorting Filter */}
                            <button
                                onClick={() => setFilterShorting(!filterShorting)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${filterShorting ? 'bg-red-600/20 text-red-300 border border-red-500/50' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <TrendingDown className="w-3.5 h-3.5" />
                                {filterShorting ? "Shorts ON" : "Shorts"}
                            </button>

                            {/* Consolidation Sort */}
                            <button
                                onClick={() => setSortConfig({ key: 'avg_3d', direction: 'asc', mode: 'absolute' })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs border whitespace-nowrap transition-all ${sortConfig.mode === 'absolute' ? 'bg-orange-950/40 text-orange-300 border-orange-500/30' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'}`}
                            >
                                <Minus className="w-3.5 h-3.5" />
                                Consolidation
                            </button>

                            <div className="h-6 w-px bg-slate-800 mx-1"></div>

                            <span className="text-xs text-slate-500 whitespace-nowrap font-mono">{processedData.length} Items</span>
                        </div>
                    </div>


                </div>

                {/* Compact Data Grid */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20 backdrop-blur-sm">
                    {/* `max-h` adapts to screen to keep search visible */}
                    <div className="overflow-x-auto max-h-[88vh] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-950 text-slate-500 uppercase font-semibold text-[10px] sticky top-0 z-20 shadow-md">
                                <tr>
                                    <ColumnHeader
                                        title="Symbol" field="symbol" type="text"
                                        sortField="symbol" currentSort={sortConfig} onSort={handleSort}
                                    />
                                    <ColumnHeader
                                        title="LTP" field="ltp" type="numeric"
                                        sortField="ltp" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['ltp']}
                                        onClear={() => updateFilter('ltp', null)}
                                        onApply={() => { }} // State is applied directly in filter
                                        filterContent={
                                            <NumericFilter
                                                min={colFilters['ltp']?.min || ''}
                                                max={colFilters['ltp']?.max || ''}
                                                setMin={(v) => updateFilter('ltp', { ...colFilters['ltp'], type: 'range', min: v })}
                                                setMax={(v) => updateFilter('ltp', { ...colFilters['ltp'], type: 'range', max: v })}
                                            />
                                        }
                                    />

                                    {/* Group: Current */}
                                    <ColumnHeader
                                        title="Today%" field="change_current" type="numeric"
                                        sortField="change_current" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['change_current']}
                                        onClear={() => updateFilter('change_current', null)}
                                        filterContent={
                                            <NumericFilter
                                                min={colFilters['change_current']?.min || ''}
                                                max={colFilters['change_current']?.max || ''}
                                                setMin={(v) => updateFilter('change_current', { ...colFilters['change_current'], type: 'range', min: v })}
                                                setMax={(v) => updateFilter('change_current', { ...colFilters['change_current'], type: 'range', max: v })}
                                            />
                                        }
                                    />
                                    <ColumnHeader
                                        title={<span className="text-[9px] tracking-tighter">Dom</span>} field="dom_current" type="category"
                                        sortField="dom_current" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['dom_current']}
                                        onClear={() => updateFilter('dom_current', null)}
                                        filterContent={
                                            <CategoryFilter
                                                options={["Buyers", "Sellers"]}
                                                selected={colFilters['dom_current']?.selected || []}
                                                onChange={(sel) => updateFilter('dom_current', { type: 'category', selected: sel })}
                                            />
                                        }
                                    />

                                    {/* Group: Past Days (Compact) */}
                                    <ColumnHeader
                                        title="1D%" field="change_1d" type="numeric"
                                        sortField="change_1d" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['change_1d']}
                                        onClear={() => updateFilter('change_1d', null)}
                                        filterContent={<NumericFilter min={colFilters['change_1d']?.min || ''} max={colFilters['change_1d']?.max || ''} setMin={v => updateFilter('change_1d', { ...colFilters['change_1d'], type: 'range', min: v })} setMax={v => updateFilter('change_1d', { ...colFilters['change_1d'], type: 'range', max: v })} />}
                                    />
                                    <ColumnHeader
                                        title={<span className="text-[9px] tracking-tighter">Dom1</span>} field="dom_1d" type="category"
                                        sortField="dom_1d" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['dom_1d']}
                                        onClear={() => updateFilter('dom_1d', null)}
                                        filterContent={<CategoryFilter options={["Buyers", "Sellers"]} selected={colFilters['dom_1d']?.selected || []} onChange={sel => updateFilter('dom_1d', { type: 'category', selected: sel })} />}
                                    />

                                    <ColumnHeader
                                        title="2D%" field="change_2d" type="numeric"
                                        sortField="change_2d" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['change_2d']}
                                        onClear={() => updateFilter('change_2d', null)}
                                        filterContent={<NumericFilter min={colFilters['change_2d']?.min || ''} max={colFilters['change_2d']?.max || ''} setMin={v => updateFilter('change_2d', { ...colFilters['change_2d'], type: 'range', min: v })} setMax={v => updateFilter('change_2d', { ...colFilters['change_2d'], type: 'range', max: v })} />}
                                    />
                                    <ColumnHeader
                                        title={<span className="text-[9px] tracking-tighter">Dom2</span>} field="dom_2d" type="category"
                                        sortField="dom_2d" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['dom_2d']}
                                        onClear={() => updateFilter('dom_2d', null)}
                                        filterContent={<CategoryFilter options={["Buyers", "Sellers"]} selected={colFilters['dom_2d']?.selected || []} onChange={sel => updateFilter('dom_2d', { type: 'category', selected: sel })} />}
                                    />

                                    <ColumnHeader
                                        title="3D%" field="change_3d" type="numeric"
                                        sortField="change_3d" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['change_3d']}
                                        onClear={() => updateFilter('change_3d', null)}
                                        filterContent={<NumericFilter min={colFilters['change_3d']?.min || ''} max={colFilters['change_3d']?.max || ''} setMin={v => updateFilter('change_3d', { ...colFilters['change_3d'], type: 'range', min: v })} setMax={v => updateFilter('change_3d', { ...colFilters['change_3d'], type: 'range', max: v })} />}
                                    />
                                    <ColumnHeader
                                        title={<span className="text-[9px] tracking-tighter">Dom3</span>} field="dom_3d" type="category"
                                        sortField="dom_3d" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['dom_3d']}
                                        onClear={() => updateFilter('dom_3d', null)}
                                        filterContent={<CategoryFilter options={["Buyers", "Sellers"]} selected={colFilters['dom_3d']?.selected || []} onChange={sel => updateFilter('dom_3d', { type: 'category', selected: sel })} />}
                                    />

                                    {/* Group: Average */}
                                    <ColumnHeader
                                        title={<span className="text-orange-400/80">Avg3D%</span>} field="avg_3d" type="numeric"
                                        sortField="avg_3d" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['avg_3d']}
                                        onClear={() => updateFilter('avg_3d', null)}
                                        filterContent={<NumericFilter min={colFilters['avg_3d']?.min || ''} max={colFilters['avg_3d']?.max || ''} setMin={v => updateFilter('avg_3d', { ...colFilters['avg_3d'], type: 'range', min: v })} setMax={v => updateFilter('avg_3d', { ...colFilters['avg_3d'], type: 'range', max: v })} />}
                                    />
                                    <ColumnHeader
                                        title={<span className="text-orange-400/80">AvgDom</span>} field="avg_dom_3d" type="category"
                                        sortField="avg_dom_3d" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['avg_dom_3d']}
                                        onClear={() => updateFilter('avg_dom_3d', null)}
                                        filterContent={<CategoryFilter options={["Buyers", "Sellers", "Balance"]} selected={colFilters['avg_dom_3d']?.selected || []} onChange={sel => updateFilter('avg_dom_3d', { type: 'category', selected: sel })} />}
                                    />


                                    {/* Indicators */}
                                    <ColumnHeader
                                        title="RSI" field="rsi" type="numeric"
                                        sortField="rsi" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['rsi']}
                                        onClear={() => updateFilter('rsi', null)}
                                        filterContent={
                                            <NumericFilter
                                                min={colFilters['rsi']?.min || ''}
                                                max={colFilters['rsi']?.max || ''}
                                                setMin={(v) => updateFilter('rsi', { ...colFilters['rsi'], type: 'range', min: v })}
                                                setMax={(v) => updateFilter('rsi', { ...colFilters['rsi'], type: 'range', max: v })}
                                            />
                                        }
                                    />
                                    <ColumnHeader
                                        title="MACD" field="macd_signal" type="category"
                                        sortField="macd_signal" currentSort={sortConfig} onSort={handleSort}
                                        activeFilter={!!colFilters['macd_signal']}
                                        onClear={() => updateFilter('macd_signal', null)}
                                        filterContent={
                                            <CategoryFilter
                                                options={["Bullish Growing", "Bullish Waning", "Bearish Growing", "Bearish Waning", "Neutral"]}
                                                selected={colFilters['macd_signal']?.selected || []}
                                                onChange={(sel) => updateFilter('macd_signal', { type: 'category', selected: sel })}
                                            />
                                        }
                                    />
                                    <ColumnHeader
                                        title={
                                            <div className="flex items-center gap-1">
                                                Score
                                                <HelpCircle className="w-3 h-3 text-slate-600" />
                                            </div>
                                        }
                                        field="strength_score"
                                        type="numeric"
                                        sortField="strength_score"
                                        currentSort={sortConfig}
                                        onSort={handleSort}
                                        activeFilter={!!colFilters['strength_score']}
                                        onClear={() => updateFilter('strength_score', null)}
                                        filterContent={
                                            <NumericFilter
                                                min={colFilters['strength_score']?.min || ''}
                                                max={colFilters['strength_score']?.max || ''}
                                                setMin={(v) => updateFilter('strength_score', { ...colFilters['strength_score'], type: 'range', min: v })}
                                                setMax={(v) => updateFilter('strength_score', { ...colFilters['strength_score'], type: 'range', max: v })}
                                            />
                                        }
                                        headerChildren={
                                            <div className="absolute right-0 top-8 w-72 bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-50 hidden group-hover:block text-left">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b border-slate-700 pb-1">Strength Score Formula (0-100)</h4>

                                                <div className="space-y-2">
                                                    <div>
                                                        <h5 className="text-[9px] font-semibold text-blue-400 mb-0.5">1. Trend (Max 40)</h5>
                                                        <ul className="space-y-0.5 text-[9px] text-slate-300">
                                                            <li className="flex justify-between"><span>Price &gt; EMA50</span> <span className="text-emerald-400">+20</span></li>
                                                            <li className="flex justify-between"><span>Price &gt; EMA20</span> <span className="text-emerald-400">+10</span></li>
                                                            <li className="flex justify-between"><span>Price &gt; 10 Day High</span> <span className="text-emerald-400">+10</span></li>
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <h5 className="text-[9px] font-semibold text-purple-400 mb-0.5">2. Momentum (Max 40)</h5>
                                                        <ul className="space-y-0.5 text-[9px] text-slate-300">
                                                            <li className="flex justify-between"><span>RSI 50-70 (Bullish)</span> <span className="text-emerald-400">+20</span></li>
                                                            <li className="flex justify-between"><span>RSI &gt; 70 (Strong)</span> <span className="text-emerald-400">+10</span></li>
                                                            <li className="flex justify-between"><span>MACD &gt; Signal</span> <span className="text-emerald-400">+10</span></li>
                                                            <li className="flex justify-between"><span>MACD Growing</span> <span className="text-emerald-400">+10</span></li>
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <h5 className="text-[9px] font-semibold text-orange-400 mb-0.5">3. Volume (Max 20)</h5>
                                                        <ul className="space-y-0.5 text-[9px] text-slate-300">
                                                            <li className="flex justify-between"><span>Buyers Dominant</span> <span className="text-emerald-400">+10</span></li>
                                                            <li className="flex justify-between"><span>Vol &gt; 10 Day Avg</span> <span className="text-emerald-400">+10</span></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {loading && processedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={15} className="p-8 text-center text-slate-500 animate-pulse">
                                            Scanning Market Data...
                                        </td>
                                    </tr>
                                ) : processedData.map((item, idx) => (
                                    <tr key={item.token} className={`hover:bg-slate-800/40 transition-colors group ${idx % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
                                        <td className="p-2 font-bold text-white sticky left-0 bg-[#0a0a0a] group-hover:bg-slate-800 border-r border-slate-800 text-xs">
                                            {item.symbol}
                                        </td>
                                        <td className="p-2 font-mono text-right text-slate-300">
                                            {item.ltp.toFixed(2)}
                                        </td>

                                        {/* Current */}
                                        <td className={`p-2 font-mono text-center font-bold bg-slate-900/20 ${item.change_current >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {item.change_current > 0 ? '+' : ''}{item.change_current}%
                                        </td>
                                        <td className="p-2 text-center bg-slate-900/20 border-r border-slate-800/30">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] border ${getDomColor(item.dom_current)}`}>
                                                {item.dom_current ? item.dom_current.toUpperCase().slice(0, 3) : "-"}
                                            </span>
                                        </td>

                                        {/* 1D */}
                                        <td className={`p-2 font-mono text-center ${item.change_1d >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                            {item.change_1d}%
                                        </td>
                                        <td className="p-2 text-center border-r border-slate-800/30">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[10px] opacity-70 ${item.dom_1d === 'Buyers' ? 'text-emerald-400' : 'text-red-400'}`}>{item.dom_1d && item.dom_1d[0]}</span>
                                                {item.breakout_times?.['1d'] && <span className="text-[8px] text-slate-500 font-mono leading-tight">{item.breakout_times['1d']}</span>}
                                            </div>
                                        </td>

                                        {/* 2D */}
                                        <td className={`p-2 font-mono text-center ${item.change_2d >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                            {item.change_2d}%
                                        </td>
                                        <td className="p-2 text-center border-r border-slate-800/30">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[10px] opacity-70 ${item.dom_2d === 'Buyers' ? 'text-emerald-400' : 'text-red-400'}`}>{item.dom_2d && item.dom_2d[0]}</span>
                                                {item.breakout_times?.['2d'] && <span className="text-[8px] text-slate-500 font-mono leading-tight">{item.breakout_times['2d']}</span>}
                                            </div>
                                        </td>

                                        {/* 3D */}
                                        <td className={`p-2 font-mono text-center ${item.change_3d >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                            {item.change_3d}%
                                        </td>
                                        <td className="p-2 text-center border-r border-slate-800/30">
                                            <span className={`text-[10px] opacity-70 ${item.dom_3d === 'Buyers' ? 'text-emerald-400' : 'text-red-400'}`}>{item.dom_3d && item.dom_3d[0]}</span>
                                        </td>

                                        {/* Avg 3D */}
                                        <td className={`p-2 font-mono text-center font-bold bg-slate-900/20 text-xs ${Math.abs(item.avg_3d) < 0.5 ? 'text-white' : (item.avg_3d > 0 ? 'text-emerald-400' : 'text-red-400')}`}>
                                            {item.avg_3d}%
                                        </td>
                                        <td className="p-2 text-center bg-slate-900/20 border-r border-slate-800/30">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] border ${getDomColor(item.avg_dom_3d)}`}>
                                                {item.avg_dom_3d ? item.avg_dom_3d[0] : "-"}
                                            </span>
                                        </td>

                                        {/* Indicators */}
                                        <td className="p-2 text-center">
                                            <span className={`text-[10px] font-bold ${item.rsi > 70 ? 'text-red-400' : item.rsi < 30 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                {item.rsi}
                                            </span>
                                        </td>
                                        <td className="p-2 text-center">
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider whitespace-nowrap
                                                ${item.macd_signal?.includes("Bullish") ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' :
                                                    item.macd_signal?.includes("Bearish") ? 'bg-red-950/40 text-red-400 border border-red-500/20' :
                                                        'bg-slate-800 text-slate-400'}`}>
                                                {item.macd_signal === "Bullish Growing" ? "BULL++" :
                                                    item.macd_signal === "Bullish Waning" ? "BULL+" :
                                                        item.macd_signal === "Bearish Growing" ? "BEAR--" :
                                                            item.macd_signal === "Bearish Waning" ? "BEAR-" : "NEUT"}
                                            </span>
                                        </td>
                                        <td className="p-2 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-xs font-mono font-bold text-slate-300">{item.strength_score}</span>
                                                <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.strength_score > 60 ? 'bg-purple-500' : item.strength_score < 40 ? 'bg-stone-500' : 'bg-blue-500'}`} style={{ width: `${item.strength_score}%` }} />
                                                </div>
                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}



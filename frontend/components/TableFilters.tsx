import { useState, useEffect, useRef } from "react";
import { Search, Check, TrendingUp, TrendingDown, ArrowUp, ArrowDown, X, Filter } from "lucide-react";

interface FilterPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onClear: () => void;
    onApply: () => void;
    onSortAsc: () => void;
    onSortDesc: () => void;
}

export function FilterPopover({ isOpen, onClose, title, children, onClear, onApply, onSortAsc, onSortDesc }: FilterPopoverProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div ref={ref} className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950/50 rounded-t-lg">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">Filter: {title}</span>
                <button onClick={onClose} className="text-slate-500 hover:text-white">
                    <X className="w-3 h-3" />
                </button>
            </div>

            {/* Sort Buttons */}
            <div className="flex gap-2 p-3 border-b border-slate-800">
                <button onClick={onSortAsc} className="flex-1 flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] py-1.5 rounded transition-colors border border-slate-700">
                    <ArrowUp className="w-3 h-3" /> Asc
                </button>
                <button onClick={onSortDesc} className="flex-1 flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] py-1.5 rounded transition-colors border border-slate-700">
                    <ArrowDown className="w-3 h-3" /> Desc
                </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                {children}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/30 flex justify-between items-center rounded-b-lg">
                <button onClick={onClear} className="text-[10px] text-slate-500 hover:text-slate-300 font-medium">Clear</button>
                <button onClick={onApply} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 px-4 rounded shadow-lg shadow-blue-500/20 transition-all">
                    Apply
                </button>
            </div>
        </div>
    );
}

// Numeric Filter Component (Min/Max)
export function NumericFilter({ min, max, setMin, setMax }: { min: string, max: string, setMin: (v: string) => void, setMax: (v: string) => void }) {
    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase">Min Value</label>
                <input
                    type="number"
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                    placeholder="Min"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder:text-slate-700"
                />
            </div>
            <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase">Max Value</label>
                <input
                    type="number"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                    placeholder="Max"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder:text-slate-700"
                />
            </div>
        </div>
    );
}

// Category Filter Component (Multi-Select)
export function CategoryFilter({ options, selected, onChange }: { options: string[], selected: string[], onChange: (selected: string[]) => void }) {
    const [search, setSearch] = useState("");

    const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(s => s !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    const toggleAll = () => {
        if (selected.length === options.length) {
            onChange([]);
        } else {
            onChange(options);
        }
    };

    return (
        <div className="space-y-2">
            <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-500" />
                <input
                    type="text"
                    autoFocus
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded pl-7 pr-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
            </div>

            <div className="space-y-1">
                <div
                    className="flex items-center gap-2 p-1.5 hover:bg-slate-800/50 rounded cursor-pointer group select-none"
                    onClick={toggleAll}
                >
                    <div className={`w-3 h-3 rounded flex items-center justify-center border transition-colors ${selected.length === options.length ? 'bg-blue-600 border-blue-600' : 'border-slate-700 bg-slate-900 group-hover:border-slate-600'}`}>
                        {selected.length === options.length && <Check className="w-2 h-2 text-white" />}
                    </div>
                    <span className="text-[10px] text-slate-300 font-bold">(SELECT ALL)</span>
                </div>

                <div className="space-y-0.5 max-h-32 overflow-y-auto pr-1">
                    {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                        <div
                            key={opt}
                            className="flex items-center gap-2 p-1.5 hover:bg-slate-800/50 rounded cursor-pointer group transition-colors select-none"
                            onClick={() => toggleOption(opt)}
                        >
                            <div className={`w-3 h-3 rounded flex items-center justify-center border transition-colors ${selected.includes(opt) ? 'bg-blue-600 border-blue-600' : 'border-slate-700 bg-slate-900 group-hover:border-slate-600'}`}>
                                {selected.includes(opt) && <Check className="w-2 h-2 text-white" />}
                            </div>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-200 truncate">{opt}</span>
                        </div>
                    )) : (
                        <div className="text-[10px] text-slate-600 text-center py-2 italic">No matches</div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface ColumnHeaderProps {
    title: React.ReactNode;
    field: string;
    type: 'numeric' | 'category' | 'text';
    sortField: string;
    currentSort: { key: string, direction: 'asc' | 'desc' } | null;
    onSort: (key: string, direction: 'asc' | 'desc') => void;

    // Filter props
    activeFilter?: boolean;
    filterContent?: React.ReactNode; // Content for the popover
    onClear?: () => void;
    onApply?: () => void;

    // Extra
    headerChildren?: React.ReactNode;
}

export function ColumnHeader({ title, field, type, sortField, currentSort, onSort, activeFilter, filterContent, onClear, onApply, headerChildren }: ColumnHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSort = (direction: 'asc' | 'desc') => {
        onSort(sortField, direction);
    };

    const handleSortClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Cycle: null -> asc -> desc -> asc
        const nextDir = currentSort?.key === sortField && currentSort.direction === 'asc' ? 'desc' : 'asc';
        onSort(sortField, nextDir);
    };

    const handleFilterClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <th className="p-2 text-center relative group">
            <div className="flex items-center justify-center gap-1">
                {/* Title & Sort Area - Click to Sort */}
                <div
                    className={`cursor-pointer hover:text-white transition-colors flex items-center gap-1 ${currentSort?.key === sortField ? 'text-blue-400' : 'text-slate-400'}`}
                    onClick={handleSortClick}
                    title="Click to Sort"
                >
                    <span className="text-xs font-bold whitespace-nowrap flex items-center gap-1">{title}</span>
                    {currentSort?.key === sortField && (
                        currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />
                    )}
                </div>

                {/* Filter Icon - Click to Open Menu */}
                <div
                    className={`p-1 rounded hover:bg-slate-800 cursor-pointer transition-all ${activeFilter ? 'text-blue-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}
                    onClick={handleFilterClick}
                    title="Filter"
                >
                    <Filter className="w-3 h-3" />
                </div>
            </div>

            {headerChildren}

            {/* Filter Popover */}
            {filterContent && (
                <FilterPopover
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title={typeof title === 'string' ? title : ''} // Sanitize title for popover if complex
                    onSortAsc={() => handleSort('asc')}
                    onSortDesc={() => handleSort('desc')}
                    onClear={() => { onClear?.(); setIsOpen(false); }}
                    onApply={() => { onApply?.(); setIsOpen(false); }}
                >
                    {filterContent}
                </FilterPopover>
            )}
        </th>
    );
}

import { Play, Search, TrendingUp, TrendingDown } from "lucide-react";

interface SignalItem {
    symbol: string;
    percent: number;
    dateTime: string;
    daySegment?: string; // For Index Alpha
    status: "BULL" | "BEAR";
    logoUrl?: string; // Optional URL for logo
}

interface InsiderTableProps {
    title: string;
    subtitle?: string; // e.g., "LOM SHORT TERM"
    type: "INTRA" | "SWING" | "BO" | "REVERSAL" | "INDEX" | "2DAY"; // Added new types
    items: SignalItem[];
    showDaySegment?: boolean;
}

export default function InsiderTable({ title, type, items, showDaySegment = false }: InsiderTableProps) {
    // Icon logic based on type
    const renderIcon = () => {
        if (type === "INTRA") return <div className="text-blue-500 font-black italic mr-2 text-xl">INTRA</div>;
        if (type === "SWING") return <div className="text-blue-400 font-black italic mr-2 text-xl">SWING</div>;
        if (type === "BO") return <div className="text-blue-300 font-black italic mr-2 text-xl">BO</div>;
        if (type === "REVERSAL") return <div className="text-red-400 font-black italic mr-2 text-xs flex flex-col items-center"><span>REVERSAL</span></div>;
        if (type === "2DAY") return <div className="text-orange-400 font-black italic mr-2 text-xs flex flex-col items-center leading-none"><span>2 D</span><span>H/L</span></div>;
        if (type === "INDEX") return <div className="text-yellow-400 font-black italic mr-2 text-xl flex items-center"><span>»</span><span className="text-orange-500">«</span></div>;
        return null;
    };

    return (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        {renderIcon()}
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            {title}
                            <span className="text-yellow-400">💡</span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs text-blue-400 font-medium cursor-pointer hover:underline">
                            How to use <Play className="w-3 h-3 fill-current" />
                        </div>
                        <div className="bg-white/10 rounded-full px-2 py-0.5 flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-slate-200">LIVE</span>
                        </div>
                    </div>
                </div>
                {/* Search Bar */}
                <div className="relative w-32 md:w-36">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 bg-slate-900/50 p-2 rounded-t-lg">
                <div className={`${showDaySegment ? 'col-span-3' : 'col-span-5'} pl-2`}>Symbol</div>
                <div className="col-span-2 text-center">%</div>
                <div className="col-span-3 text-right">Date-Time</div>
                {showDaySegment && <div className="col-span-2 text-center">Day Segment</div>}
                <div className="col-span-2 text-center">Action</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700">
                {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-sm p-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors group">
                        {/* Symbol Cell */}
                        <div className={`${showDaySegment ? 'col-span-3' : 'col-span-5'} flex items-center gap-3`}>
                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center overflow-hidden shrink-0">
                                {/* Mock Logo or Initial */}
                                <span className="text-xs font-bold text-slate-900">{item.symbol.substring(0, 2)}</span>
                            </div>
                            <span className="font-bold text-white tracking-wide truncate">{item.symbol}</span>
                        </div>

                        {/* Percent Cell */}
                        <div className="col-span-2 flex items-center justify-center">
                            {/* Visual Indicator of trend */}
                            <div className="flex items-center gap-1">
                                {item.percent >= 0 ?
                                    <TrendingUp className="w-3 h-3 text-green-500 hidden md:block" /> :
                                    <TrendingDown className="w-3 h-3 text-red-500 hidden md:block" />
                                }
                                <div className={`flex items-center px-1.5 py-0.5 rounded text-xs font-bold w-12 justify-center ${item.percent >= 0 ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                    }`}>
                                    {item.percent > 0 ? "+" : ""}{item.percent.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Date Time */}
                        <div className="col-span-3 text-right text-xs text-slate-400 font-mono flex flex-col items-end justify-center">
                            <span>{item.dateTime.includes(" ") ? item.dateTime.split(" ")[0] : item.dateTime}</span>
                            {item.dateTime.includes(" ") && <span className="text-slate-500">{item.dateTime.split(" ")[1].slice(0, 5)}</span>}
                        </div>

                        {/* Day Segment (Optional) */}
                        {showDaySegment && (
                            <div className="col-span-2 text-center text-xs font-medium text-slate-300">
                                {item.daySegment || "-"}
                            </div>
                        )}

                        {/* Action Badge */}
                        <div className="col-span-2 flex justify-center">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide ${item.status === "BULL"
                                ? "bg-[#D1FAE5] text-[#065F46] border border-green-400/50 hover:bg-[#A7F3D0]"
                                : "bg-[#FEE2E2] text-[#991B1B] border border-red-400/50 hover:bg-[#FECACA]"
                                }`}>
                                {item.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Layers, Sunrise } from "lucide-react";

export default function MarketNav() {
    const pathname = usePathname();

    const tabs = [
        {
            name: "Intraday Boost",
            href: "/stocks/market-plus/intraday",
            icon: Zap,
            color: "text-orange-500"
        },
        {
            name: "Pre-Market",
            href: "/stocks/market-plus/pre-market",
            icon: Sunrise,
            color: "text-yellow-500"
        },
        {
            name: "Positional Breakouts",
            href: "/stocks/market-plus/positional",
            icon: Layers,
            color: "text-blue-500"
        }
    ];

    return (
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`group flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${isActive
                            ? "border-orange-500 text-slate-900 dark:text-white font-bold"
                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                    >
                        <Icon className={`w-4 h-4 ${isActive ? tab.color : "text-slate-400 group-hover:text-slate-500"}`} />
                        <span>{tab.name}</span>
                    </Link>
                );
            })}
        </div>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import {
    Activity,
    BarChart2,
    TrendingUp,
    PieChart,
    Clock,
    Zap,
    Layers,
    Bitcoin,
    Radio,
    Star,
    FileText,
    HelpCircle,
    Settings,
    LogOut,
    X,
    ChevronRight,
    Search
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

export default function Sidebar() {
    const pathname = usePathname();
    const { isOpen, closeSidebar, isDesktopOpen } = useSidebar();

    // Menu Configuration
    const menuGroups = [
        {
            title: "Stocks",
            icon: BarChart2,
            items: [
                { name: "Market Pulse", href: "/stocks/market-plus" },
                { name: "Insider Strategy", href: "/stocks/insider" },
                { name: "Sector Scope", href: "/stocks/sector-scope" },
                { name: "Swing Spectrum", href: "/stocks/swing" },
                { name: "Pro Analytics", href: "/pro" },
                { name: "Find Stock", href: "/stocks/find" },
            ]
        },
        {
            title: "Index",
            icon: Activity,
            items: [
                { name: "Option Clock", href: "/opt/clock" },
                { name: "Option Apex", href: "/opt/apex" },
                { name: "Index Mover", href: "/opt/mover" },
            ]
        },
        {
            title: "FII / DII",
            icon: BarChart2, // Placeholder icon
            items: [], // No sub-items in image, or maybe it's a single link? Assuming single for now or empty group
            href: "/fii-dii"
        },
        {
            title: "Crypto Chart",
            icon: Bitcoin,
            href: "/crypto",
            badge: "New"
        },
        {
            title: "Live Analysis",
            icon: Radio,
            href: "/live",
            badge: "New"
        }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
                    onClick={closeSidebar}
                />
            )}

            <aside className={`flex flex-col w-72 min-h-screen bg-[#111827] border-r border-slate-800 fixed left-0 top-0 z-50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"
                } ${isDesktopOpen ? "md:translate-x-0" : "md:-translate-x-full"}`}>

                {/* Header / Logo Area */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50">
                    <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-white">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">NGTA</span>
                    </div>
                    <button onClick={closeSidebar} className="md:hidden text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Scroll Area */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">

                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="group-section">
                            {/* Group Header / Single Item */}
                            {group.href ? (
                                <Link
                                    href={group.href}
                                    className={`flex items-center justify-between px-2 py-2 text-slate-400 hover:text-white transition-colors ${pathname === group.href ? "text-blue-400 font-medium" : ""}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <group.icon className="w-5 h-5" />
                                        <span className="font-medium">{group.title}</span>
                                    </div>
                                    {group.badge && (
                                        <span className="bg-blue-600/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                            {group.badge}
                                        </span>
                                    )}
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3 px-2 py-2 text-slate-400 font-medium select-none">
                                    <group.icon className="w-5 h-5" />
                                    <span>{group.title}</span>
                                </div>
                            )}

                            {/* Sub Items (Tree) */}
                            {group.items && group.items.length > 0 && (
                                <div className="ml-4 pl-4 border-l border-slate-800 space-y-1 mt-1 relative">
                                    {group.items.map((item, subIdx) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={subIdx}
                                                href={item.href}
                                                className="relative group flex items-center gap-3 px-2 py-2 transition-all"
                                            >
                                                {/* Curved Connector */}
                                                {/* <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-4 h-[1px] bg-slate-800 group-hover:bg-slate-600 transition-colors"></div> */}

                                                <div className={`absolute -left-[17px] top-0 bottom-1/2 w-4 border-b border-l border-slate-800 rounded-bl-xl`} style={{ height: 'calc(50% + 1px)' }}></div>

                                                <span className={`text-sm tracking-wide transition-colors ${isActive
                                                    ? "text-blue-400 font-semibold"
                                                    : "text-slate-500 group-hover:text-slate-300"
                                                    }`}>
                                                    {item.name}
                                                </span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}

                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-800 bg-[#0f1623]">
                    <div className="flex items-center justify-between gap-1">
                        <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <Star className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <FileText className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <HelpCircle className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            <style jsx>{`
                .group-section .ml-4.pl-4 {
                    border-left: 1px solid #1e293b; 
                }
               .group-section .ml-4.pl-4 > a:last-child {
                   position: relative;
               }
               
               .group-section .ml-4.pl-4 > a:last-child::after {
                   content: '';
                   position: absolute;
                   left: -18px; 
                   top: 50%;
                   bottom: 0;
                   width: 2px;
                   background-color: #111827; 
               }
            `}</style>
        </>
    );
}

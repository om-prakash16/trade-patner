"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Activity, LayoutDashboard, TrendingUp, Newspaper, ChevronRight, Link as LinkIcon, X } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

export default function Sidebar() {
    const pathname = usePathname();
    const [status, setStatus] = useState("Checking...");
    const API_URL = "http://localhost:8000";
    const { isOpen, closeSidebar } = useSidebar();

    useEffect(() => {
        checkServer();
        const interval = setInterval(checkServer, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkServer = async () => {
        try {
            await axios.get(`${API_URL}/`, { timeout: 5000 });
            setStatus("System Online");
        } catch {
            setStatus("Backend Offline");
        }
    };

    const links = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Pro Scanner", href: "/pro", icon: Activity },
        { name: "Strength & F&O", href: "/strength", icon: TrendingUp },
        { name: "MarketPlus", href: "/stocks/market-plus", icon: TrendingUp },
        { name: "Market News", href: "/news", icon: Newspaper },
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

            <aside className={`flex flex-col w-64 min-h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                }`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100">
                        <Activity className="w-6 h-6 text-orange-500" />
                        <span>NGTA</span>
                    </div>
                    {/* Close Button for Mobile */}
                    <button onClick={closeSidebar} className="md:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 space-y-1">
                    <div className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Menu
                    </div>
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? "bg-slate-100 dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200 dark:border-slate-800/50"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-orange-500" : "text-slate-500 group-hover:text-slate-300"}`} />
                                    {link.name}
                                </div>
                                {isActive && <ChevronRight className="w-3 h-3 text-orange-500/50" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Status Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50">

                    {/* Broker Connect */}
                    <div className="mb-4 space-y-2">
                        <button
                            onClick={() => window.open("http://localhost:8000/upstox/login", "_blank")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                        >
                            <LinkIcon className="w-3 h-3" /> Connect Upstox
                        </button>
                        {/* Angel One Status (Static for now) */}
                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            Angel One Connected
                        </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-800/50">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-medium text-slate-400">System Status</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status === "System Online" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-600"}`}>
                                {status === "System Online" ? "LIVE" : "OFFLINE"}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                            v2.4.0-stable
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { Activity, Menu, ChevronDown, Radio } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

export default function Navbar() {
    const [status, setStatus] = useState("Checking...");
    const [selectedBroker, setSelectedBroker] = useState<"Angel One" | "Upstox">("Angel One");
    const [isBrokerMenuOpen, setIsBrokerMenuOpen] = useState(false);

    const API_URL = "http://localhost:8000";
    const { toggleSidebar, toggleDesktop } = useSidebar();

    useEffect(() => {
        checkServer();
        const interval = setInterval(checkServer, 30000); // Check every 30s
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

    const handleConnectUpstox = () => {
        window.location.href = "http://localhost:8000/upstox/login";
    };

    return (
        <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left Section: Buttons & Logo */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button onClick={toggleSidebar} className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden">
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Desktop Toggle (Visible on Desktop) */}
                        <button onClick={toggleDesktop} className="hidden md:flex p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>


                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-100">
                                NGTA <span className="text-orange-500">Console</span>
                            </span>
                        </div>

                    </div>

                    {/* Right Section: Broker & Status */}
                    <div className="flex items-center gap-4">

                        {/* Broker Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setIsBrokerMenuOpen(!isBrokerMenuOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/50 text-sm font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-all"
                            >
                                <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">API:</span>
                                {selectedBroker}
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                            </button>

                            {/* Dropdown Menu */}
                            {isBrokerMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="p-1">
                                        <button
                                            onClick={() => { setSelectedBroker("Angel One"); setIsBrokerMenuOpen(false); }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedBroker === "Angel One" ? "bg-blue-600/10 text-blue-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                                        >
                                            <Radio className={`w-3 h-3 ${selectedBroker === "Angel One" ? "text-blue-500" : "text-slate-600"}`} />
                                            Angel One
                                        </button>
                                        <button
                                            onClick={() => { setSelectedBroker("Upstox"); setIsBrokerMenuOpen(false); }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedBroker === "Upstox" ? "bg-purple-600/10 text-purple-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                                        >
                                            <Radio className={`w-3 h-3 ${selectedBroker === "Upstox" ? "text-purple-500" : "text-slate-600"}`} />
                                            Upstox
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action / Status Pill */}
                        {selectedBroker === "Upstox" ? (
                            <button
                                onClick={handleConnectUpstox}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 transition-all"
                            >
                                Connect Upstox
                            </button>
                        ) : (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${status === "System Online"
                                ? "bg-emerald-950/50 border-emerald-800 text-emerald-400"
                                : "bg-red-950/50 border-red-800 text-red-400"
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${status === "System Online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                                {status}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Overlay to close menu */}
            {isBrokerMenuOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsBrokerMenuOpen(false)}></div>
            )}
        </nav>
    );
}

"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // Avoid hydration mismatch

    return (
        <div className="flex items-center gap-1 border border-slate-700 bg-slate-900/50 rounded-lg p-1">
            <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-md transition-all ${theme === "light"
                        ? "bg-slate-200 text-orange-500 shadow-sm"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                aria-label="Light Mode"
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-md transition-all ${theme === "dark"
                        ? "bg-slate-800 text-blue-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                aria-label="Dark Mode"
            >
                <Moon className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`px-2 py-1.5 text-[10px] uppercase font-bold rounded-md transition-all ${theme === "system"
                        ? "bg-slate-800 text-slate-200 shadow-sm"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                aria-label="System Mode"
            >
                Auto
            </button>
        </div>
    );
}

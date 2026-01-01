"use client";

import { useSidebar } from "@/context/SidebarContext";
import { ReactNode } from "react";

export default function LayoutShell({
    children,
    navbar,
    sidebar,
    footer
}: {
    children: ReactNode,
    navbar: ReactNode,
    sidebar: ReactNode,
    footer: ReactNode
}) {
    const { isDesktopOpen } = useSidebar();

    return (
        <>
            {sidebar}
            <div className="flex-1 flex flex-col min-h-screen">
                {navbar}
                <div
                    className={`flex-grow p-4 md:p-6 transition-all duration-300 ${isDesktopOpen ? "md:ml-72" : "md:ml-0"
                        }`}
                >
                    <div className="max-w-[1920px] mx-auto w-full">
                        {children}
                    </div>
                </div>
                <div className={`transition-all duration-300 ${isDesktopOpen ? "md:ml-72" : "md:ml-0"}`}>
                    {footer}
                </div>
            </div>
        </>
    );
}

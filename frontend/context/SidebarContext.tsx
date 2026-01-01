"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface SidebarContextType {
    isOpen: boolean; // Mobile State
    toggleSidebar: () => void;
    closeSidebar: () => void;
    isDesktopOpen: boolean; // Desktop State
    toggleDesktop: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDesktopOpen, setIsDesktopOpen] = useState(true); // Default open on desktop

    const toggleSidebar = () => setIsOpen(prev => !prev);
    const closeSidebar = () => setIsOpen(false);
    const toggleDesktop = () => setIsDesktopOpen(prev => !prev);

    return (
        <SidebarContext.Provider value={{ isOpen, toggleSidebar, closeSidebar, isDesktopOpen, toggleDesktop }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}

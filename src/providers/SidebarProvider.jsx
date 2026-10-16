'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext(undefined);

export function SidebarProvider({ children }) {
    const [isOpen, setIsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
        const mql = window.matchMedia('(max-width: 767px)');
        const apply = () => setIsMobile(mql.matches);
        apply();
        mql.addEventListener('change', apply);
        return () => mql.removeEventListener('change', apply);
    }, []);

    // Auto-state management based on device type change
    useEffect(() => {
        if (isMobile) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
        }
    }, [isMobile]);

    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeSidebar = () => setIsOpen(false);
    const openSidebar = () => setIsOpen(true);

    return (
        <SidebarContext.Provider
            value={{
                isOpen,
                isMobile,
                toggleSidebar,
                closeSidebar,
                openSidebar,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}

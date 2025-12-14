'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext(undefined);

export function SidebarProvider({ children }) {
    const [isOpen, setIsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            // Auto-close sidebar on mobile by default
            if (window.innerWidth < 768) {
                setIsOpen(false);
            } else {
                setIsOpen(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

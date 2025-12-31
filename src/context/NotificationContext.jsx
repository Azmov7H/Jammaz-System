'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <NotificationContext.Provider value={{
            isSidebarOpen,
            setIsSidebarOpen
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotificationCenter = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotificationCenter must be used within NotificationProvider');
    return context;
};

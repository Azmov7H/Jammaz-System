'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const {
        notifications,
        unreadCount,
        isLoading,
        refetch,
        readMutation,
        deleteMutation
    } = useNotifications();

    const markAsRead = useCallback(async (id = 'all') => {
        try {
            await readMutation.mutateAsync(id);
        } catch (err) {
            toast.error('فشل الرد على الإشعار');
        }
    }, [readMutation]);

    const deleteNotification = useCallback(async (id) => {
        try {
            await deleteMutation.mutateAsync(id);
        } catch (err) {
            toast.error('فشل حذف الإشعار');
        }
    }, [deleteMutation]);

    const performAction = useCallback(async (id) => {
        const notif = notifications.find(n => n._id === id);
        if (!notif) return;

        setActionLoadingId(id);
        try {
            // 1. Mark as read
            await markAsRead(id);

            // 2. Perform Navigation if link exists
            if (notif.link) {
                router.push(notif.link);
            }

            // 3. Optional: Hit action API if specific logic needed (currently just generic)
            // await api.post(`/api/notifications/${id}/action`, { action: notif.actionType });

            setIsSidebarOpen(false); // Close sidebar on action
        } catch (err) {
            toast.error(err.message || 'فشل تنفيذ الإجراء');
        } finally {
            setActionLoadingId(null);
        }
    }, [notifications, markAsRead, router, setIsSidebarOpen]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isSidebarOpen,
            setIsSidebarOpen,
            markAsRead,
            deleteNotification,
            performAction,
            loading: isLoading,
            actionLoadingId,
            refresh: refetch
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

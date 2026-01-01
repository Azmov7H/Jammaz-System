'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CACHE_CONFIG } from '@/lib/cache-config';

export function useNotifications() {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading, refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await fetch('/api/notifications');
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const json = await res.json();
            return json.data?.notifications || [];
        },
        ...CACHE_CONFIG.NOTIFICATIONS,
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (ids = 'all') => {
            const res = await fetch('/api/notifications/mark-read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (!res.ok) throw new Error('Failed to mark as read');
            const json = await res.json();
            return json.data;
        },
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            const previousNotifications = queryClient.getQueryData(['notifications']);

            queryClient.setQueryData(['notifications'], (old) => {
                const current = Array.isArray(old) ? old : [];
                if (ids === 'all') {
                    return current.map(n => ({ ...n, isRead: true }));
                }
                const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
                return current.map(n => idSet.has(n._id) ? { ...n, isRead: true } : n);
            });

            return { previousNotifications };
        },
        onError: (err, ids, context) => {
            queryClient.setQueryData(['notifications'], context.previousNotifications);
            toast.error('فشل التحديث: ' + err.message);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const url = id === 'all' ? '/api/notifications' : `/api/notifications/${id}`;
            const res = await fetch(url, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            const json = await res.json();
            return json.data;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            const previousNotifications = queryClient.getQueryData(['notifications']);

            queryClient.setQueryData(['notifications'], (old) => {
                const current = Array.isArray(old) ? old : [];
                if (id === 'all') return [];
                return current.filter(n => n._id !== id);
            });

            return { previousNotifications };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(['notifications'], context.previousNotifications);
            toast.error('فشل الحذف: ' + err.message);
        },
        onSuccess: () => {
            toast.success('تم الحذف بنجاح');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const actionMutation = useMutation({
        mutationFn: async (notificationId) => {
            const res = await fetch('/api/notifications/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId })
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Server Error');
            }
            return json.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success(data?.message || 'تمت العملية بنجاح');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const unreadCount = (Array.isArray(notifications) ? notifications : []).filter(n => !n.isRead).length;

    return {
        notifications: Array.isArray(notifications) ? notifications : [],
        isLoading,
        unreadCount,
        refetch,
        markAsRead: markAsReadMutation.mutate,
        deleteNotification: deleteMutation.mutate,
        performAction: actionMutation.mutate,
        isActionLoading: actionMutation.isPending,
        activeActionId: actionMutation.variables
    };
}

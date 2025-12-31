'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useNotifications() {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading, refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await fetch('/api/notifications');
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const data = await res.json();
            return data.notifications || [];
        },
        refetchInterval: 60000, // Sync every minute
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (ids = 'all') => {
            const res = await fetch('/api/notifications/mark-read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (!res.ok) throw new Error('Failed to mark as read');
            return res.json();
        },
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            const previousNotifications = queryClient.getQueryData(['notifications']);

            queryClient.setQueryData(['notifications'], (old) => {
                if (ids === 'all') {
                    return old?.map(n => ({ ...n, isRead: true }));
                }
                const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
                return old?.map(n => idSet.has(n._id) ? { ...n, isRead: true } : n);
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
            return res.json();
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            const previousNotifications = queryClient.getQueryData(['notifications']);

            queryClient.setQueryData(['notifications'], (old) => {
                if (id === 'all') return [];
                return old?.filter(n => n._id !== id);
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
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Server Error');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success(data.message || 'تمت العملية بنجاح');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return {
        notifications,
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

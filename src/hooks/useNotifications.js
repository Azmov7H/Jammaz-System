'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useNotifications() {
    const queryClient = useQueryClient();

    // 1. Fetch main list
    const { data: listData, isLoading, refetch } = useQuery({
        queryKey: ['notifications', 'list'],
        queryFn: async () => {
            const res = await fetch('/api/notifications?limit=20');
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            return json.data; // { notifications, pagination, unreadCount }
        },
        refetchInterval: 30000 // Poll every 30s
    });

    const notifications = listData?.notifications || [];

    // 2. Fetch specific unread count (lighter poll)
    const { data: countData } = useQuery({
        queryKey: ['notifications', 'count'],
        queryFn: async () => {
            const res = await fetch('/api/notifications/unread-count');
            if (!res.ok) return { unreadCount: 0 };
            const json = await res.json();
            return json.data;
        },
        refetchInterval: 15000, // Poll every 15s
        initialData: { unreadCount: 0 }
    });

    // Use count from list if fresh, otherwise separate poll
    const unreadCount = listData?.unreadCount ?? countData?.unreadCount ?? 0;

    // 3. Mutations
    const markAsReadMutation = useMutation({
        mutationFn: async (ids = 'all') => {
            const res = await fetch('/api/notifications/read', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (!res.ok) throw new Error('Failed to update');
            return res.json();
        },
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });

            // Optimistic update
            queryClient.setQueryData(['notifications', 'list'], (old) => {
                if (!old) return old;
                let newNotifs = [...(old.notifications || [])];

                if (ids === 'all') {
                    newNotifs = newNotifs.map(n => ({ ...n, isRead: true }));
                    return { ...old, notifications: newNotifs, unreadCount: 0 };
                } else {
                    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
                    let readCount = 0;
                    newNotifs = newNotifs.map(n => {
                        if (idSet.has(n._id) && !n.isRead) {
                            readCount++;
                            return { ...n, isRead: true };
                        }
                        return n;
                    });
                    return { ...old, notifications: newNotifs, unreadCount: Math.max(0, (old.unreadCount || 0) - readCount) };
                }
            });

            // Also update count query specifically
            queryClient.setQueryData(['notifications', 'count'], (old) => {
                if (ids === 'all') return { unreadCount: 0 };
                return old;
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            return res.json();
        },
        onSuccess: () => {
            toast.success('تم الحذف');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: (err) => toast.error(err.message)
    });

    return {
        notifications,
        isLoading,
        unreadCount,
        refetch,
        markAsRead: markAsReadMutation.mutate,
        deleteNotification: deleteMutation.mutate
    };
}

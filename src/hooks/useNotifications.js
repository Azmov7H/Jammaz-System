'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useNotifications() {
    const queryClient = useQueryClient();

    const { data: listData, isLoading, refetch } = useQuery({
        queryKey: ['notifications', 'list'],
        queryFn: async () => {
            const res = await api.get('/api/notifications?limit=20');
            return res.data;
        },
        refetchInterval: 30000
    });

    const notifications = listData?.notifications || [];
    const unreadCount = listData?.unreadCount || 0;

    const readMutation = useMutation({
        mutationFn: (ids = 'all') => api.patch('/api/notifications/mark-read', { ids }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/notifications/${id}`),
        onSuccess: () => {
            toast.success('تم الحذف');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    return {
        notifications,
        unreadCount,
        isLoading,
        refetch,
        readMutation,
        deleteMutation
    };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useStockMovements(params = {}) {
    return useQuery({
        queryKey: ['stock-movements', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams(params);
            return await api.get(`/api/stock/movements?${searchParams.toString()}`);
        }
    });
}

export function useStockStatus(params = {}) {
    return useQuery({
        queryKey: ['stock-status', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams(params);
            return await api.get(`/api/stock?${searchParams.toString()}`);
        }
    });
}

export function useAddStockMovement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/stock/move', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('تم تسجيل الحركة بنجاح');
        },
        onError: (error) => {
            toast.error(error.message || 'فشل تسجيل الحركة');
        }
    });
}

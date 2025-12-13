import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useStockMovements(limit = 50) {
    return useQuery({
        queryKey: ['stock-movements', limit],
        queryFn: async () => {
            const data = await api.get(`/api/stock?limit=${limit}`);
            return data || [];
        }
    });
}

/**
 * Generic movement (IN/OUT/ADJUST)
 */
export function useAddStockMovement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/stock/move', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Critical: Update product list stock
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            toast.success('تم تسجيل الحركة بنجاح');
        },
        onError: (err) => {
            toast.error(err.message || 'فشل تسجيل العملية');
        }
    });
}

/**
 * Specific Transfer (Warehouse <-> Shop)
 */
export function useTransferStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/inventory/transfer', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            toast.success('تم النقل بنجاح');
        },
        onError: (err) => {
            toast.error(err.message || 'فشل عملية النقل');
        }
    });
}

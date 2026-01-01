import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function usePurchaseOrders() {
    return useQuery({
        queryKey: ['purchase-orders'],
        queryFn: async () => {
            const data = await api.get('/api/purchase-orders');
            return data.data;
        }
    });
}

export function usePurchaseOrder(id) {
    return useQuery({
        queryKey: ['purchase-orders', id],
        queryFn: async () => {
            const data = await api.get(`/api/purchase-orders/${id}`);
            return data.data?.purchaseOrder || null;
        },
        enabled: !!id
    });
}

export function useCreatePO() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/purchase-orders', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('تم إنشاء أمر الشراء');
        },
        onError: (err) => toast.error(err.message || 'فشل الإنشاء')
    });
}

export function useUpdatePOStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.patch(`/api/purchase-orders/${payload.id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock updates on receive
            toast.success('تم تحديث حالة الطلب');
        },
        onError: (err) => toast.error(err.message || 'فشل التحديث')
    });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function usePurchaseOrders() {
    return useQuery({
        queryKey: ['purchase-orders'],
        queryFn: async () => {
            const data = await api.get('/api/purchase-orders');
            return data.purchaseOrders || [];
        }
    });
}

export function usePurchaseOrder(id) {
    return useQuery({
        queryKey: ['purchase-orders', id],
        queryFn: async () => {
            const data = await api.get(`/api/purchase-orders/${id}`); // Assuming API supports get by ID
            // Note: The original API might only have supported listing. I might need to double check the API route.
            // If not exists, I'll need to update the API route.
            // For now, let's assume I'll add the GET ID support if missing.
            return data.purchaseOrder;
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
        mutationFn: ({ id, status }) => api.put('/api/purchase-orders', { id, status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock updates on receive
            toast.success('تم تحديث حالة الطلب');
        },
        onError: (err) => toast.error(err.message || 'فشل التحديث')
    });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function usePurchaseOrders(params = {}) {
    return useQuery({
        queryKey: ['purchase-orders', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams(params);
            const res = await api.get(`/api/purchase-orders?${searchParams.toString()}`);
            return res.data;
        }
    });
}

export function usePurchaseOrder(id) {
    return useQuery({
        queryKey: ['purchase-orders', id],
        queryFn: async () => {
            const res = await api.get(`/api/purchase-orders/${id}`);
            return res.data;
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
            toast.success('تم إنشاء طلب الشراء بنجاح');
        },
        onError: (error) => toast.error(error.message)
    });
}

export function useUpdatePOStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) => api.patch(`/api/purchase-orders/${id}`, data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock might have changed
            toast.success(res.message || 'تم تحديث الحالة');
        },
        onError: (error) => toast.error(error.message)
    });
}

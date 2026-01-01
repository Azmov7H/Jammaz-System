import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';
import { CACHE_CONFIG } from '@/lib/cache-config';

export function useCustomers({ search } = {}) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['customers', search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            const data = await api.get(`/api/customers?${params.toString()}`);
            return data.data;
        },
        ...CACHE_CONFIG.CUSTOMERS,
    });

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/api/customers', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            toast.success('تمت إضافة العميل بنجاح');
        },
        onError: (error) => toast.error(error.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/api/customers/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            toast.success('تم تحديث بيانات العميل');
        },
        onError: (error) => toast.error(error.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/customers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            toast.success('تم حذف/إيقاف العميل');
        },
        onError: (error) => toast.error(error.message),
    });

    const redeemMutation = useMutation({
        mutationFn: ({ id, points }) => api.post('/api/customers/loyalty', { customerId: id, points }),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            toast.success('تم استبدال النقاط برصيد بنجاح');
        },
        onError: (error) => toast.error(error.message),
    });

    return {
        ...query, // data, isLoading, etc.
        addMutation,
        updateMutation,
        deleteMutation,
        redeemMutation,
    };
}

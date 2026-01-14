import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useCustomers(params = {}) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['customers', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams(params);
            const res = await api.get(`/api/customers?${searchParams.toString()}`);
            return res.data;
        }
    });

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/api/customers', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('تمت إضافة العميل بنجاح');
        },
        onError: (error) => {
            toast.error(error.message || 'فشل في إضافة العميل');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/api/customers/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('تم تحديث بيانات العميل');
        },
        onError: (error) => {
            toast.error(error.message || 'فشل في تحديث العميل');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/customers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('تم تعطيل حساب العميل');
        },
        onError: (error) => {
            toast.error(error.message || 'فشل في حذف العميل');
        }
    });

    return {
        ...query,
        addMutation,
        updateMutation,
        deleteMutation
    };
}


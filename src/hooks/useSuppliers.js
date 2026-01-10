import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useSuppliers(params = {}) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['suppliers', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (params.search) searchParams.append('search', params.search);
            if (params.page) searchParams.append('page', params.page);
            if (params.limit) searchParams.append('limit', params.limit);

            const res = await api.get(`/api/suppliers?${searchParams.toString()}`);
            return res.data;
        }
    });

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/api/suppliers', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('تم إضافة المورد بنجاح');
        },
        onError: (err) => toast.error(err.message || 'فشل إضافة المورد')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/api/suppliers/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('تم تحديث بيانات المورد');
        },
        onError: (err) => toast.error(err.message || 'فشل تحديث البيانات')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/suppliers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('تم حذف المورد بنجاح');
        },
        onError: (err) => toast.error(err.message || 'فشل الحذف')
    });

    return {
        ...query,
        addMutation,
        updateMutation,
        deleteMutation
    };
}

export function useSupplier(id) {
    return useQuery({
        queryKey: ['suppliers', id],
        queryFn: async () => {
            const res = await api.get(`/api/suppliers/${id}`);
            return res.data.supplier;
        },
        enabled: !!id
    });
}

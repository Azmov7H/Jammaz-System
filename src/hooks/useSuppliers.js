import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useSuppliers() {
    return useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const data = await api.get('/api/suppliers');
            return data.data || [];
        },
    });
}

export function useAddSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/suppliers', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('تم إضافة المورد بنجاح');
        },
        onError: (err) => {
            toast.error(err.message || 'فشل إضافة المورد');
        }
    });
}

export function useUpdateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => api.put(`/api/suppliers`, { ...data, _id: id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('تم تحديث بيانات المورد');
        },
        onError: (err) => {
            toast.error(err.message || 'فشل التحديث');
        }
    });
}

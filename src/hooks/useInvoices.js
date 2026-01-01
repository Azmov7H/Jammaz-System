import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useInvoices(search = '') {
    return useQuery({
        queryKey: ['invoices', search],
        queryFn: async () => {
            const query = search ? `?search=${search}` : '';
            const data = await api.get(`/api/invoices${query}`);
            return data.data;
        }
    });
}

export function useCreateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/api/invoices', data);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock changes
            // toast moved to component to handle redirect, or here
            toast.success('تم إنشاء الفاتورة بنجاح');
        },
        onError: (err) => {
            toast.error(err.message || 'فشل إنشاء الفاتورة');
        }
    });
}

export function useDeleteInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/api/invoices/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock might return
            toast.success('تم حذف الفاتورة');
        },
        onError: (err) => {
            toast.error(err.message || 'فشل الحذف');
        }
    });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useInvoices(params = {}) {
    return useQuery({
        queryKey: ['invoices', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams(params);
            const res = await api.get(`/api/invoices?${searchParams.toString()}`);
            return res.data;
        }
    });
}

export function useCreateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/invoices', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('تم إنشاء الفاتورة بنجاح');
        },
        onError: (error) => toast.error(error.message)
    });
}

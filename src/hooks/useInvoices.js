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
        mutationFn: async (data) => {
            const response = await api.post('/api/invoices', data);
            // API response structure: { success: true, data: invoice, message: null }
            // Return the invoice data
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error) => {
            // Show error toast with longer duration for better visibility
            toast.error(error.message || 'فشل في إنشاء الفاتورة', {
                duration: 5000, // 5 seconds
                important: true
            });
        }
    });
}

export function useDeleteInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/api/invoices/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('تم حذف الفاتورة بنجاح');
        },
        onError: (error) => {
            toast.error(error.message || 'فشل في حذف الفاتورة');
        }
    });
}

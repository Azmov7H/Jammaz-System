import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useTreasury() {
    return useQuery({
        queryKey: ['treasury'],
        queryFn: async () => {
            const data = await api.get('/api/financial/treasury');
            return data.data || { balance: 0, transactions: [] };
        }
    });
}

export function useAddTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/financial/transaction', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['treasury'] });
            toast.success('تم تسجيل المعاملة بنجاح');
        },
        onError: (err) => {
            toast.error(err.message || 'فشل تسجيل المعاملة');
        }
    });
}

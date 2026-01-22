// Financial hooks for treasury and debts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useTreasury(params = {}) {
    return useQuery({
        queryKey: ['treasury', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams(params);
            const res = await api.get(`/api/financial/treasury?${searchParams}`);
            return res.data;
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
        }
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/api/financial/transaction/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['treasury'] });
            toast.success('تم التراجع عن المعاملة بنجاح');
        },
        onError: (err) => toast.error(err.message || 'فشل التراجع عن المعاملة')
    });
}

export function useDebts(params = {}) {
    return useQuery({
        queryKey: ['debts', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams(params);
            const res = await api.get(`/api/financial/debts?${searchParams}`);
            return res.data;
        }
    });
}

export function useDebtOverview() {
    return useQuery({
        queryKey: ['debt-overview'],
        queryFn: async () => {
            const res = await api.get('/api/financial/debt-overview');
            return res.data;
        }
    });
}

export function useAddPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/financial/payments', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['debt-overview'] });
            toast.success('تم تسجيل الدفعة بنجاح');
        },
        onError: (err) => toast.error(err.message || 'فشل تسجيل الدفعة')
    });
}

export function useDebtInstallments(debtId) {
    return useQuery({
        queryKey: ['debt-installments', debtId],
        queryFn: async () => {
            const res = await api.get(`/api/financial/debts/${debtId}/installments`);
            return res.data;
        },
        enabled: !!debtId
    });
}

export function useCreateInstallments() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ debtId, data }) => api.post(`/api/financial/debts/${debtId}/installments`, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['debt-installments', variables.debtId] });
            toast.success('تم جدولة المديونية بنجاح');
        },
        onError: (err) => toast.error(err.message || 'فشل جدولة المديونية')
    });
}

export function useReceivables(params = {}) {
    return useQuery({
        queryKey: ['receivables', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams(params);
            const res = await api.get(`/api/payments?${searchParams}`);
            return res.data;
        }
    });
}

export function useSyncDebts() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/api/financial/debts/sync', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('تمت مزامنة المديونيات بنجاح');
        },
        onError: (err) => toast.error(err.message || 'فشل مزامنة المديونيات')
    });
}

export function useUpdateDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => api.patch(`/api/financial/debts/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['debt-overview'] });
            toast.success('تم تحديث بيانات الدين بنجاح');
        },
        onError: (err) => toast.error(err.message || 'فشل تحديث بيانات الدين')
    });
}

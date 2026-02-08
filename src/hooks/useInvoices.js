import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';
import { useFilters } from './useFilters';

/**
 * Base hook to fetch invoices with optional filters
 */
export function useInvoices(params = {}) {
    return useQuery({
        queryKey: ['invoices', params],
        queryFn: () => api.get('/api/invoices', params)
    });
}

/**
 * mutation for creating a new invoice
 */
export function useCreateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            return await api.post('/api/invoices', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error) => {
            toast.error(error.message || 'فشل في إنشاء الفاتورة', {
                duration: 5000,
                important: true
            });
        }
    });
}

/**
 * mutation for deleting an invoice
 */
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

/**
 * Integrated hook for the Invoices Page (Consolidated from useInvoicesPage.js)
 */
export function useInvoicesPageManager() {
    const {
        search, setSearch,
        filter, setFilter,
        page, setPage,
        limit,
        queryContext,
        handleSearch
    } = useFilters(15);

    const { data: invoicesData, isLoading, isError, refetch } = useInvoices(queryContext);

    const invoices = invoicesData?.invoices || [];
    const pagination = invoicesData?.pagination || { total: 0, pages: 1, page: 1, limit };
    const deleteMutation = useDeleteInvoice();

    const handleDelete = (id) => {
        if (!confirm('هل أنت متأكد من حذف الفاتورة؟ سيتم استرجاع الكميات للمخزن.')) return;
        deleteMutation.mutate(id);
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            if (filter === 'all') return true;
            const type = inv.paymentType || 'cash';
            if (filter === 'cash') return ['cash', 'bank', 'wallet', 'check'].includes(type);
            if (filter === 'credit') return type === 'credit';
            return true;
        });
    }, [invoices, filter]);

    const stats = useMemo(() => {
        const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const invoicesCount = filteredInvoices.length;
        const immediatePayments = ['cash', 'bank', 'wallet', 'check'];
        const cashInvoices = filteredInvoices.filter(inv => immediatePayments.includes(inv.paymentType || 'cash')).length;
        const creditInvoices = filteredInvoices.filter(inv => (inv.paymentType || 'cash') === 'credit').length;

        return { totalSales, invoicesCount, cashInvoices, creditInvoices };
    }, [filteredInvoices]);

    return {
        searchTerm: search, // Keep name for compatibility
        filterType: filter, setFilterType: setFilter,
        handleSearch,
        handleDelete,
        filteredInvoices,
        isLoading,
        isError,
        refetch,
        stats,
        page,
        setPage,
        pagination
    };
}

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';
import { useDebounce } from './useDebounce';

/**
 * Base hook to fetch invoices with optional filters
 */
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

/**
 * mutation for creating a new invoice
 */
export function useCreateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/api/invoices', data);
            return response.data;
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
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, cash, credit
    const [page, setPage] = useState(1);
    const limit = 15;

    const debouncedSearch = useDebounce(searchTerm, 500);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const { data: invoicesData, isLoading } = useInvoices({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {})
    });
    const invoices = invoicesData?.invoices || [];
    const pagination = invoicesData?.pagination || { total: 0, pages: 1, page: 1, limit };
    const deleteMutation = useDeleteInvoice();

    const handleDelete = (id) => {
        if (!confirm('هل أنت متأكد من حذف الفاتورة؟ سيتم استرجاع الكميات للمخزن.')) return;
        deleteMutation.mutate(id);
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            if (filterType === 'all') return true;
            const type = inv.paymentType || 'cash';
            if (filterType === 'cash') return type === 'cash';
            if (filterType === 'credit') return type === 'credit' || type === 'bank';
            return true;
        });
    }, [invoices, filterType]);

    const stats = useMemo(() => {
        const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const invoicesCount = filteredInvoices.length;
        const cashInvoices = filteredInvoices.filter(inv => (inv.paymentType || 'cash') === 'cash').length;
        const creditInvoices = filteredInvoices.filter(inv => (inv.paymentType || 'cash') !== 'cash').length;

        return { totalSales, invoicesCount, cashInvoices, creditInvoices };
    }, [filteredInvoices]);

    return {
        searchTerm,
        filterType, setFilterType,
        handleSearch,
        handleDelete,
        filteredInvoices,
        isLoading,
        stats,
        // Pagination
        page,
        setPage,
        pagination
    };
}


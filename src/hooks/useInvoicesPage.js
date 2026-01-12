import { useState, useMemo } from 'react';
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices';

export function useInvoicesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, cash, credit

    // Handlers
    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => setDebouncedSearch(val), 500);
    };

    // Data Fetching
    const { data: invoicesData, isLoading } = useInvoices(debouncedSearch ? { search: debouncedSearch } : {});
    const invoices = invoicesData?.invoices || [];
    const deleteMutation = useDeleteInvoice();

    const handleDelete = (id) => {
        if (!confirm('هل أنت متأكد من حذف الفاتورة؟ سيتم استرجاع الكميات للمخزن.')) return;
        deleteMutation.mutate(id);
    };

    // Filter Logic
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            if (filterType === 'all') return true;
            // Assuming paymentType exists, default to cash if not
            const type = inv.paymentType || 'cash';
            if (filterType === 'cash') return type === 'cash';
            if (filterType === 'credit') return type === 'credit' || type === 'bank';
            return true;
        });
    }, [invoices, filterType]);

    // Stats
    const stats = useMemo(() => {
        const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const invoicesCount = filteredInvoices.length;
        const cashInvoices = filteredInvoices.filter(inv => (inv.paymentType || 'cash') === 'cash').length;
        const creditInvoices = filteredInvoices.filter(inv => (inv.paymentType || 'cash') !== 'cash').length;

        return {
            totalSales,
            invoicesCount,
            cashInvoices,
            creditInvoices
        };
    }, [filteredInvoices]);

    return {
        searchTerm,
        filterType, setFilterType,
        handleSearch,
        handleDelete,
        filteredInvoices,
        isLoading,
        stats
    };
}

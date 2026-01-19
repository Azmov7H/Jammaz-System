import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useSalesReturns(params = {}) {
    return useQuery({
        queryKey: ['sales-returns', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams(params);
            const res = await api.get(`/api/sales-returns?${searchParams.toString()}`);
            return res.data;
        }
    });
}

export function useInvoiceReturns(invoiceId) {
    return useQuery({
        queryKey: ['invoice-returns', invoiceId],
        queryFn: async () => {
            if (!invoiceId) return { returns: [] };
            const res = await api.get(`/api/invoices/${invoiceId}/returns`);
            return res.data;
        },
        enabled: !!invoiceId
    });
}

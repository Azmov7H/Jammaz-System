import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const data = await api.get('/api/dashboard/stats');
            return data || {
                stats: { products: 0, lowStock: 0, invoices: 0, sales: 0 },
                chartData: [],
                topSelling: [],
                recentInvoices: []
            };
        },
        // Auto refresh every 5 minutes?? No, user can refresh manually.
        staleTime: 1000 * 60 * 1, // 1 minute
    });
}

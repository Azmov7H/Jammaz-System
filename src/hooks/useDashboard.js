import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';

export function useDashboard() {
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['dashboard-unified'],
        queryFn: async () => {
            return await api.get('/api/dashboard');
        },
        staleTime: 30 * 1000, // 30 seconds - reduces re-fetching
        refetchOnWindowFocus: false, // Prevents unnecessary API calls
    });

    const data = response || {};

    return {
        kpis: data.kpis || {},
        monthSummary: data.monthSummary || {},
        recentActivity: data.recentActivity || [],
        lowStockProducts: data.lowStockProducts || [],
        stats: data.stats || {},
        chartData: data.chartData || [],
        topSelling: data.topSelling || [],
        strategy: data.strategy || { suggestions: [], stats: {} },
        isLoading,
        refetch
    };
}

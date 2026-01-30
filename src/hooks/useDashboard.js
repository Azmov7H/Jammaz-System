import { useQuery } from '@tanstack/react-query';

export function useDashboard() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['dashboard-unified'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard');
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000, // 30 seconds - reduces re-fetching
        refetchOnWindowFocus: false, // Prevents unnecessary API calls
    });

    return {
        kpis: data?.kpis || {},
        monthSummary: data?.monthSummary || {},
        recentActivity: data?.recentActivity || [],
        lowStockProducts: data?.lowStockProducts || [],
        stats: data?.stats || {},
        chartData: data?.chartData || [],
        topSelling: data?.topSelling || [],
        strategy: data?.strategy || { suggestions: [], stats: {} },
        isLoading,
        refetch
    };
}

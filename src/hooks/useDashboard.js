import { useQuery } from '@tanstack/react-query';

export function useDashboard() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['dashboard-kpis'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/kpis');
            const json = await res.json();
            return json.data;
        }
    });

    const kpis = data?.kpis || {};
    const monthSummary = data?.monthSummary || {};
    const recentActivity = data?.recentActivity || [];
    const lowStockProducts = data?.lowStockProducts || [];

    return {
        data,
        kpis,
        monthSummary,
        recentActivity,
        lowStockProducts,
        isLoading,
        refetch
    };
}

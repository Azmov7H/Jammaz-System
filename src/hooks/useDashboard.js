import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';

export function useDashboardKPIs() {
    return useQuery({
        queryKey: ['dashboard-kpis'],
        queryFn: async () => {
            const res = await api.get('/api/dashboard/kpis');
            return res.data;
        }
    });
}

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await api.get('/api/dashboard/stats');
            return res.data;
        }
    });
}

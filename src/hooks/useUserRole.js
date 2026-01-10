import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';

export function useUserRole() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['user-session'],
        queryFn: async () => {
            return await api.get('/api/auth/session');
        },
        staleTime: 1000 * 60 * 5,
        retry: 1
    });

    const user = data?.data?.user || null;
    const role = user?.role || null;

    return { role, user, loading: isLoading, refetch };
}

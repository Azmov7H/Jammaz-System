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

    // The API returns { success: true, data: { ...user }, ... }
    // So 'data' from useQuery is the full response object.
    // 'data.data' is the user object itself.
    const user = data?.data || null;
    const role = user?.role || null;

    return { role, user, loading: isLoading, refetch };
}

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';

export function useUserRole() {
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['user-session'],
        queryFn: async () => {
            try {
                const response = await api.get('/api/auth/session');
                console.log('[useUserRole] Session Response:', response);
                return response;
            } catch (err) {
                console.warn('[useUserRole] Session Fetch Failed:', err.message);
                throw err;
            }
        },
        staleTime: 1000 * 60 * 5,
        retry: 1,
        refetchOnWindowFocus: true
    });

    // Handle data extract from { success: true, data: { ...user } }
    // The 'api' utility returns the parsed JSON directly.
    // If AuthService.getSession(token) returns null, data will be { success: true, data: null }
    const responseData = data;
    const user = responseData || null;
    const role = user?.role || null;

    if (isError) {
        console.error('[useUserRole] CRITICAL ERROR:', error);
    }

    // Determine current status
    const isLoggedOut = !isLoading && !user && !isError;

    return {
        role,
        user,
        loading: isLoading,
        isError,
        isLoggedOut,
        refetch
    };
}

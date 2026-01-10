import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api as ApiClient } from '@/lib/api-utils';
import { toast } from 'sonner';

/**
 * Hook for Physical Inventory operations
 */
export function usePhysicalInventory(id = null) {
    const queryClient = useQueryClient();

    // 1. Fetch List
    const useCounts = (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.location && filters.location !== 'all') params.append('location', filters.location);

        return useQuery({
            queryKey: ['physical-inventory', filters],
            queryFn: async () => {
                const res = await ApiClient.get(`/api/physical-inventory?${params.toString()}`);
                return res.data.counts;
            }
        });
    };

    // 2. Fetch Detail
    const useCount = (countId) => {
        return useQuery({
            queryKey: ['physical-inventory', countId],
            queryFn: async () => {
                const res = await ApiClient.get(`/api/physical-inventory/${countId}`);
                return res.data.count;
            },
            enabled: !!countId
        });
    };

    // 3. Create Mutation
    const createMutation = useMutation({
        mutationFn: (data) => ApiClient.post('/api/physical-inventory', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['physical-inventory']);
        }
    });

    // 4. Update Mutation (Patch Items)
    const updateMutation = useMutation({
        mutationFn: (data) => ApiClient.patch(`/api/physical-inventory/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['physical-inventory', id]);
            toast.success('تم حفظ التغييرات بنجاح');
        },
        onError: (err) => toast.error(err.message || 'فشل الحفظ')
    });

    // 5. Complete Mutation
    const completeMutation = useMutation({
        mutationFn: () => ApiClient.post(`/api/physical-inventory/${id}/complete`),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['physical-inventory']);
            toast.success(res.data.message || 'تم اعتماد الجرد بنجاح');
        },
        onError: (err) => toast.error(err.message || 'فشل الاعتماد')
    });

    // 6. Unlock Mutation
    const unlockMutation = useMutation({
        mutationFn: (password) => ApiClient.post(`/api/physical-inventory/${id}/unlock`, { password }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['physical-inventory', id]);
            toast.success(res.data.message || 'تم فتح الجرد للتعديل');
        },
        onError: (err) => toast.error(err.message || 'فشل فتح الجرد')
    });

    // 7. Recent Movements
    const useRecentMovements = (countId) => {
        return useQuery({
            queryKey: ['physical-inventory', countId, 'movements'],
            queryFn: async () => {
                const res = await ApiClient.get(`/api/physical-inventory/${countId}/recent-movements`);
                return res.data.movements;
            },
            enabled: !!countId
        });
    };

    return {
        useCounts,
        useCount,
        createMutation,
        updateMutation,
        completeMutation,
        unlockMutation,
        useRecentMovements
    };
}

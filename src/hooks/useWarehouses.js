import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import {
    getWarehouses,
    getPrimaryWarehouse,
    getWarehouse,
    getWarehouseDeletionPreflight,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
} from '@/services/warehouseService';
import { withMutationFeedback } from '@/lib/mutation-feedback';

/** Prefix key — invalidating ['warehouses'] refreshes list, primary and details. */
const BASE_KEY = ['warehouses'];

function invalidateAll(queryClient) {
    queryClient.invalidateQueries({ queryKey: BASE_KEY });
    // Stock counts and product slots depend on warehouse membership.
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['stock-status'] });
}

/** Paginated warehouses. Returns {warehouses, total}. */
export function useWarehouses(filters = {}, options = {}) {
    const params = {
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.isActive !== undefined && filters.isActive !== 'all' ? { isActive: filters.isActive } : {})
    };
    return useQuery({
        queryKey: [...BASE_KEY, 'list', params],
        queryFn: ({ signal }) => getWarehouses(params, { signal }),
        placeholderData: keepPreviousData,
        enabled: options.enabled !== false
    });
}

/** The seeded primary warehouse (used by pickers to label the default slot). */
export function usePrimaryWarehouse(options = {}) {
    return useQuery({
        queryKey: [...BASE_KEY, 'primary'],
        queryFn: ({ signal }) => getPrimaryWarehouse({ signal }),
        staleTime: 5 * 60 * 1000,
        enabled: options.enabled !== false
    });
}

export function useWarehouse(id, options = {}) {
    return useQuery({
        queryKey: [...BASE_KEY, 'detail', id],
        queryFn: ({ signal }) => getWarehouse(id, { signal }),
        enabled: !!id && options.enabled !== false
    });
}

/**
 * Deletion pre-flight. Disabled until an id is provided so the page can
 * lazily fetch it when the user opens the delete dialog.
 */
export function useWarehouseDeletionPreflight(id, options = {}) {
    return useQuery({
        queryKey: [...BASE_KEY, 'deletion-preflight', id],
        queryFn: ({ signal }) => getWarehouseDeletionPreflight(id, { signal }),
        enabled: !!id && options.enabled !== false
    });
}

export function useAddWarehouse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => createWarehouse(data),
        ...withMutationFeedback({
            successMessage: (res) => (res?.name ? `تم إضافة المخزن "${res.name}"` : 'تم إضافة المخزن بنجاح'),
            fallbackErrorMessage: 'فشل إضافة المخزن',
            afterSuccess: () => invalidateAll(queryClient)
        })
    });
}

export function useUpdateWarehouse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateWarehouse(id, data),
        ...withMutationFeedback({
            successMessage: 'تم تحديث المخزن بنجاح',
            fallbackErrorMessage: 'فشل تحديث المخزن',
            afterSuccess: () => invalidateAll(queryClient)
        })
    });
}

export function useDeleteWarehouse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => deleteWarehouse(id, payload),
        ...withMutationFeedback({
            successMessage: (res) => {
                const n = Number(res?.relocatedUnits) || 0;
                return n > 0 ? `تم حذف المخزن ونقل ${n} وحدة` : 'تم حذف المخزن بنجاح';
            },
            fallbackErrorMessage: 'فشل حذف المخزن',
            afterSuccess: () => invalidateAll(queryClient)
        })
    });
}

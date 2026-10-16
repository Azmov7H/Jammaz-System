import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStockMovements, getStockStatus, moveStock, transferStock } from '@/services/stockService';
import { withMutationFeedback } from '@/lib/mutation-feedback';

export function useStockMovements(params = {}) {
    return useQuery({
        queryKey: ['stock-movements', params],
        queryFn: ({ signal }) => getStockMovements(params, { signal })
    });
}

export function useStockStatus(params = {}) {
    return useQuery({
        queryKey: ['stock-status', params],
        queryFn: ({ signal }) => getStockStatus(params, { signal })
    });
}

export function useAddStockMovement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => moveStock(data),
        ...withMutationFeedback({
            successMessage: 'تم تسجيل الحركة بنجاح',
            fallbackErrorMessage: 'فشل تسجيل الحركة',
            afterSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
                queryClient.invalidateQueries({ queryKey: ['products'] });
            }
        })
    });
}

export function useTransferStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => transferStock(data),
        ...withMutationFeedback({
            successMessage: 'تم تحويل المخزون بين المخازن بنجاح',
            fallbackErrorMessage: 'فشل تحويل المخزون بين المخازن',
            afterSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
                queryClient.invalidateQueries({ queryKey: ['products'] });
                queryClient.invalidateQueries({ queryKey: ['stock-status'] });
            }
        })
    });
}

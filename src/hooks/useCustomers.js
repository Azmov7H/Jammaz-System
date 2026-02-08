import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';
import { useFilters } from './useFilters';

export function useCustomers() {
    const queryClient = useQueryClient();
    const {
        search, setSearch,
        page, setPage,
        limit, setLimit,
        queryContext,
        handleSearch
    } = useFilters(50);

    const query = useQuery({
        queryKey: ['customers', queryContext],
        queryFn: () => api.get('/api/customers', queryContext)
    });

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/api/customers', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('تمت إضافة العميل بنجاح');
        },
        onError: (error) => {
            toast.error(error.message || 'فشل في إضافة العميل');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/api/customers/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('تم تحديث بيانات العميل');
        },
        onError: (error) => {
            toast.error(error.message || 'فشل في تحديث العميل');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/customers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('تم تعطيل حساب العميل');
        },
        onError: (error) => {
            toast.error(error.message || 'فشل في حذف العميل');
        }
    });

    return {
        ...query,
        addMutation,
        updateMutation,
        deleteMutation,
        // Filter state
        search, setSearch,
        page, setPage,
        limit, setLimit,
        handleSearch
    };
}


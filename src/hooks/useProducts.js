import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useProducts(params = {}, options = {}) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            // Filter out internal options from query params
            const queryData = { ...params };
            const searchParams = new URLSearchParams(queryData);
            return await api.get(`/api/products?${searchParams.toString()}`);
        },
        placeholderData: (previousData) => previousData,
        ...options
    });
}

export function useAddProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/products', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('تم إضافة المنتج بنجاح');
        },
        onError: (error) => toast.error(error.message)
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.put(`/api/products/${data._id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('تم تعديل المنتج بنجاح');
        },
        onError: (error) => toast.error(error.message)
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/api/products/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('تم حذف المنتج بنجاح');
        },
        onError: (error) => toast.error(error.message)
    });
}

export function useProductMetadata() {
    return useQuery({
        queryKey: ['products-metadata'],
        queryFn: async () => {
            return await api.get('/api/products/metadata');
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}

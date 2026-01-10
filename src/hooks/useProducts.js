import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useProducts(params = {}) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams(params);
            const res = await api.get(`/api/products?${searchParams.toString()}`);
            return res.data;
        },
        placeholderData: (previousData) => previousData,
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
            const res = await api.get('/api/products/metadata');
            return res.data;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}

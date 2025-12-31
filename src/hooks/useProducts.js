import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useProducts(filters = {}) {
    // Convert filters object to URLSearchParams
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.limit) params.append('limit', filters.limit);
    // Add other filters as needed

    return useQuery({
        queryKey: ['products', filters],
        queryFn: async () => {
            const data = await api.get(`/api/products?${params.toString()}`);
            return data.products || []; // Simplify: just return the array primarily
        }
    });
}

// Hook specifically for getting metadata (brands/categories)
export function useProductMetadata() {
    return useQuery({
        queryKey: ['products', 'metadata'],
        queryFn: async () => {
            return api.get('/api/products/metadata');
        },
        staleTime: 1000 * 60 * 15 // 15 minutes cache for metadata
    });
}


//Add Product
export function useAddProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/products', data),
        onMutate: async (newProduct) => {
            await queryClient.cancelQueries({ queryKey: ['products'] });
            const previousProducts = queryClient.getQueryData(['products']);
            queryClient.setQueryData(['products', {}], (old) => [
                { ...newProduct, _id: 'temp-id-' + Date.now(), isOptimistic: true },
                ...(old || [])
            ]);
            return { previousProducts };
        },
        onError: (err, newProduct, context) => {
            queryClient.setQueryData(['products', {}], context.previousProducts);
            toast.error(err.message || 'فشل إضافة المنتج');
        },
        onSuccess: () => {
            toast.success('تم إضافة المنتج بنجاح');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.put(`/api/products/${data._id}`, data),
        onMutate: async (updatedProduct) => {
            await queryClient.cancelQueries({ queryKey: ['products'] });
            const previousProducts = queryClient.getQueryData(['products']);
            queryClient.setQueryData(['products', {}], (old) =>
                old?.map((p) => (p._id === updatedProduct._id ? { ...p, ...updatedProduct } : p))
            );
            return { previousProducts };
        },
        onError: (err, updatedProduct, context) => {
            queryClient.setQueryData(['products', {}], context.previousProducts);
            toast.error(err.message || 'فشل تحديث المنتج');
        },
        onSuccess: () => {
            toast.success('تم تحديث المنتج بنجاح');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/api/products/${id}`),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['products'] });
            const previousProducts = queryClient.getQueryData(['products']);
            queryClient.setQueryData(['products', {}], (old) =>
                old?.filter((p) => p._id !== id)
            );
            return { previousProducts };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(['products', {}], context.previousProducts);
            toast.error(err.message || 'فشل حذف المنتج');
        },
        onSuccess: () => {
            toast.success('تم حذف المنتج بنجاح');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
}


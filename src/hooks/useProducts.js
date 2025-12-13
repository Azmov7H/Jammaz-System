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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('تم إضافة المنتج بنجاح');
        },
        onError: (err) => {
            toast.error(err.message || 'فشل إضافة المنتج');
        }
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.put(`/api/products/${data._id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('تم تحديث المنتج بنجاح');
        },
        onError: (err) => {
            toast.error(err.message || 'فشل تحديث المنتج');
        }
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
        onError: (err) => {
            toast.error(err.message || 'فشل حذف المنتج');
        }
    });
}


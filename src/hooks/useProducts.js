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

// Hook specifically for getting metadata (brands/categories) - leveraging the same data but maybe cached longer if we split API later
export function useProductMetadata() {
    return useQuery({
        queryKey: ['products', 'metadata'],
        queryFn: async () => {
            // In a real app we might have a dedicated endpoint, but here we derive from list
            const data = await api.get(`/api/products?limit=1000`);
            const prods = data.products || [];
            const uniqueBrands = [...new Set(prods.map(p => p.brand).filter(Boolean))].map(b => ({ label: b, value: b }));
            const uniqueCats = [...new Set(prods.map(p => p.category).filter(Boolean))].map(c => ({ label: c, value: c }));
            return { brands: uniqueBrands, categories: uniqueCats };
        },
        staleTime: 1000 * 60 * 5 // 5 minutes cache for metadata
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
        onError: (err) => {
            toast.error(err.message || 'فشل إضافة المنتج');
        }
    });
}

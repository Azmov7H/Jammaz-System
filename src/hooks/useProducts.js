import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CACHE_CONFIG } from '@/lib/cache-config';

async function fetchProducts(params) {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`/api/products?${searchParams.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch products');
    }
    const json = await response.json();
    return json.data;
}

async function createProduct(data) {
    const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
    }
    return response.json();
}

export function useProducts(params = {}) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['products', params],
        queryFn: () => fetchProducts(params),
        keepPreviousData: true,
        ...CACHE_CONFIG.PRODUCTS,
    });

    const createMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Product created successfully');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    return {
        ...query,
        createProduct: createMutation.mutate,
        isCreating: createMutation.isPending
    };
}

export function useAddProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('تم إضافة المنتج بنجاح');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            // Implementation for update
            const response = await fetch(`/api/products/${data._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update');
            return response.json();
        },
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
        mutationFn: async (id) => {
            const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('تم حذف المنتج بنجاح');
        },
        onError: (error) => toast.error(error.message)
    });
}

export function useProductMetadata() {
    return useQuery({
        queryKey: ['product-metadata'],
        queryFn: async () => {
            const response = await fetch('/api/products/metadata');
            if (!response.ok) {
                throw new Error('Failed to fetch product metadata');
            }
            const json = await response.json();
            return json.data;
        },
        ...CACHE_CONFIG.METADATA,
        initialData: { brands: [], categories: [] }
    });
}

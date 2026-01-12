import { useState, useMemo } from 'react';
import { useProducts, useProductMetadata, useAddProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useUserRole } from '@/hooks/useUserRole';

export function useProductPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [addFormData, setAddFormData] = useState({
        name: '', code: '', retailPrice: '', buyPrice: '', minLevel: 5, brand: '', category: '',
        warehouseQty: '', shopQty: '', minProfitMargin: 0,
        subsection: '', season: '', unit: 'pcs'
    });

    const [editFormData, setEditFormData] = useState({});

    // Fetch Data
    const { data: productsData, isLoading } = useProducts({ search });
    const products = productsData?.products || [];
    const { data: metadata = { brands: [], categories: [] } } = useProductMetadata();

    // Mutations
    const addMutation = useAddProduct();
    const updateMutation = useUpdateProduct();
    const deleteMutation = useDeleteProduct();
    const { role } = useUserRole();

    const canManage = role === 'owner' || role === 'manager';

    // Derived State
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (filter === 'low') return p.stockQty <= (p.minLevel || 5) && p.stockQty > 0;
            if (filter === 'out') return p.stockQty === 0;
            return true;
        });
    }, [products, filter]);

    const stats = useMemo(() => {
        return {
            total: products.length,
            low: products.filter(p => p.stockQty <= (p.minLevel || 5) && p.stockQty > 0).length,
            out: products.filter(p => p.stockQty === 0).length,
            value: products.reduce((acc, p) => acc + (p.stockQty * (p.buyPrice || 0)), 0)
        };
    }, [products]);

    // Handlers
    const handleEditClick = (product) => {
        setSelectedProduct(product);
        setEditFormData({
            _id: product._id,
            name: product.name || '',
            code: product.code || '',
            retailPrice: product.retailPrice || product.sellPrice || '',
            buyPrice: product.buyPrice || '',
            minLevel: product.minLevel || 5,
            brand: product.brand || '',
            category: product.category || '',
            minProfitMargin: product.minProfitMargin || 0,
            subsection: product.subsection || '',
            season: product.season || '',
            unit: product.unit || 'pcs'
        });
        setIsEditDialogOpen(true);
    };

    const handleViewClick = (product) => {
        setSelectedProduct(product);
        setIsViewDialogOpen(true);
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        addMutation.mutate(addFormData, {
            onSuccess: () => {
                setIsAddDialogOpen(false);
                setAddFormData({
                    name: '', code: '', retailPrice: '', buyPrice: '', minLevel: 5, brand: '', category: '',
                    warehouseQty: '', shopQty: '', minProfitMargin: 0,
                    subsection: '', season: '', unit: 'pcs'
                });
            }
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        updateMutation.mutate(editFormData, {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
            }
        });
    };

    return {
        // State
        search, setSearch,
        filter, setFilter,
        isAddDialogOpen, setIsAddDialogOpen,
        isEditDialogOpen, setIsEditDialogOpen,
        isViewDialogOpen, setIsViewDialogOpen,
        selectedProduct,
        addFormData, setAddFormData,
        editFormData, setEditFormData,

        // Data
        products,
        filteredProducts,
        stats,
        isLoading,
        metadata,
        canManage,

        // Mutations
        addMutation,
        updateMutation,
        deleteMutation,

        // Handlers
        handleEditClick,
        handleViewClick,
        handleAddSubmit,
        handleEditSubmit
    };
}

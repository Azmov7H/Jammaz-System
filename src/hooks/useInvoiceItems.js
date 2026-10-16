import { useState } from 'react';
import { getProducts } from '@/services/productService';
import { toast } from 'sonner';

/**
 * Hook to manage invoice items (products and services)
 */
export function useInvoiceItems({ items, setItems, onReportShortage, defaultSource = 'shop' }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showServiceDialog, setShowServiceDialog] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [serviceForm, setServiceForm] = useState({
        name: '',
        costPrice: '',
        sellPrice: '',
        qty: 1
    });

    const handleProductSearch = async (term) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await getProducts({ search: term, limit: 50 });
            const foundProducts = res.data?.products || [];
            setSearchResults(foundProducts);

            if (foundProducts.length === 1) {
                const p = foundProducts[0];
                if (p.code === term || p.name === term) {
                    addItem(p);
                    setSearchTerm('');
                    setSearchResults([]);
                }
            }
        } catch (error) {
            console.error('Product search error:', error);
        }
    };

    const addItem = (product) => {
        const source = defaultSource;
        const stockToCheck = source === 'warehouse' ? (product.warehouseQty || 0) : (product.shopQty || 0);

        if (stockToCheck <= 0) {
            const otherSource = source === 'shop' ? 'warehouse' : 'shop';
            const otherStock = source === 'shop' ? product.warehouseQty : product.shopQty;

            if (otherStock > 0) {
                toast.warning(`المنتج غير متوفر في ${source === 'shop' ? 'المحل' : 'المخزن'}، ولكن يوجد ${otherStock} في ${source === 'shop' ? 'المخزن' : 'المحل'}`);
            }
            onReportShortage(product);
            return;
        }

        const existing = items.find(i => i.productId === product._id);
        if (existing) {
            toast.warning('المنتج مضاف بالفعل');
            return;
        }

        setItems([...items, {
            productId: product._id,
            name: product.name,
            code: product.code,
            unitPrice: product.retailPrice || product.sellPrice || 0,
            qty: 1,
            source: source,
            // null → primary warehouse (backend treats null/undefined as primary)
            warehouseId: null,
            shopQty: product.shopQty || 0,
            warehouseQty: product.warehouseQty || 0,
            warehouseStocks: product.warehouseStocks || [],
            maxQty: stockToCheck,
            retailPrice: product.retailPrice || product.sellPrice,
            wholesalePrice: product.wholesalePrice,
            specialPrice: product.specialPrice,
            buyPrice: product.buyPrice || 0,
            minProfitMargin: product.minProfitMargin || 0
        }]);
        setSearchTerm('');
        setSearchResults([]);
    };

    /**
     * Available quantity for an item given its source and (optional) selected
     * warehouse slot. warehouseId falsy → the primary warehouse quantity.
     */
    const availableQty = (item, warehouseId = item.warehouseId) => {
        if (item.source !== 'warehouse') return item.shopQty || 0;
        if (!warehouseId) return item.warehouseQty || 0;
        const slot = (item.warehouseStocks || []).find(
            s => String(s.warehouseId) === String(warehouseId)
        );
        return slot?.qty || 0;
    };

    const updateQty = (index, qty) => {
        const item = items[index];
        const maxAvailable = availableQty(item);

        if (Number(qty) > maxAvailable) {
            toast.error(`الكمية المتوفرة في ${item.source === 'warehouse' ? 'المخزن' : 'المحل'} فقط ${maxAvailable}`);
            return;
        }
        const newItems = [...items];
        newItems[index].qty = Number(qty);
        setItems(newItems);
    };

    const updatePrice = (index, newPrice) => {
        const item = items[index];
        const price = Number(newPrice);

        if (price <= 0) {
            toast.error('السعر يجب أن يكون أكبر من صفر');
            return;
        }

        if (price < item.buyPrice) {
            toast.warning('🔴 تحذير: السعر أقل من سعر الشراء!');
        } else if (item.minProfitMargin > 0) {
            const profitMargin = ((price - item.buyPrice) / item.buyPrice) * 100;
            if (profitMargin < item.minProfitMargin) {
                toast.warning(`🟠 تحذير: هامش الربح (${profitMargin.toFixed(1)}%) أقل من الحد الأدنى`);
            }
        }

        const newItems = [...items];
        newItems[index].unitPrice = price;
        setItems(newItems);
    };

    const removeItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateSource = (index, source) => {
        const newItems = [...items];
        const item = newItems[index];
        item.source = source;
        // Reset the warehouse selection when leaving/switching source: the shop
        // has no warehouse, and returning to warehouse defaults to the primary.
        item.warehouseId = null;

        const maxAvailable = availableQty(item, null);
        if (item.qty > maxAvailable) {
            item.qty = Math.min(1, maxAvailable);
            toast.info(`تم تغيير المصدر. الكمية المتوفرة: ${maxAvailable}`);
        }

        setItems(newItems);
    };

    const updateWarehouse = (index, warehouseId) => {
        const newItems = [...items];
        const item = newItems[index];
        item.warehouseId = warehouseId || null;

        const maxAvailable = availableQty(item);
        if (item.qty > maxAvailable) {
            item.qty = maxAvailable > 0 ? Math.min(item.qty, maxAvailable) : 0;
            if (maxAvailable > 0) {
                toast.info(`تم تغيير المخزن. الكمية المتوفرة: ${maxAvailable}`);
            }
        }

        setItems(newItems);
    };

    const addServiceItem = () => {
        if (!serviceForm.name || !serviceForm.sellPrice) {
            toast.error('الرجاء إدخال اسم الخدمة وسعر البيع');
            return;
        }

        const newItem = {
            productId: null,
            productName: serviceForm.name,
            name: serviceForm.name,
            unitPrice: Number(serviceForm.sellPrice),
            qty: Number(serviceForm.qty),
            isService: true,
            source: 'shop',
            shopQty: 0,
            warehouseQty: 0,
            buyPrice: Number(serviceForm.costPrice) || 0,
            minProfitMargin: 0
        };

        setItems([...items, newItem]);
        setServiceForm({ name: '', costPrice: '', sellPrice: '', qty: 1 });
        setShowServiceDialog(false);
        toast.success('تم إضافة الخدمة بنجاح');
    };

    return {
        searchTerm, setSearchTerm,
        searchResults, setSearchResults,
        showServiceDialog, setShowServiceDialog,
        showProductModal, setShowProductModal,
        serviceForm, setServiceForm,
        handleProductSearch,
        addItem,
        updateQty,
        updatePrice,
        removeItem,
        updateSource,
        updateWarehouse,
        availableQty,
        addServiceItem
    };
}

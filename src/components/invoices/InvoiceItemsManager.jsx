'use client';

import { useState } from 'react';
import { Search, Package, ShoppingCart, Trash2, AlertTriangle, Store, Warehouse, Plus, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { ProductSelectorModal } from './ProductSelectorModal';

export function InvoiceItemsManager({ items, setItems, onReportShortage, defaultSource = 'shop' }) {
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
            const res = await fetch(`/api/products?search=${term}&limit=50`);
            const json = await res.json();
            const data = json.data;
            const foundProducts = data?.products || [];
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
            console.error(error);
        }
    };

    const addItem = (product) => {
        // Determine initial source based on global default
        const source = defaultSource;
        const stockToCheck = source === 'warehouse' ? (product.warehouseQty || 0) : (product.shopQty || 0);

        if (stockToCheck <= 0) {
            // Check if other source has stock to suggest it? 
            // For now just report shortage if requested source is empty, or maybe let them add it but show warning.
            // Existing logic enforced > 0. Let's keep strict for now but maybe we should allow adding with 0 if they want to force it?
            // The prompt says "I requested inventory... charge only to store". 
            // If I request warehouse and it has stock, it should work.
            if (stockToCheck <= 0) {
                const otherSource = source === 'shop' ? 'warehouse' : 'shop';
                const otherStock = source === 'shop' ? product.warehouseQty : product.shopQty;

                if (otherStock > 0) {
                    toast.warning(`المنتج غير متوفر في ${source === 'shop' ? 'المحل' : 'المخزن'}، ولكن يوجد ${otherStock} في ${source === 'shop' ? 'المخزن' : 'المحل'}`);
                }
                onReportShortage(product);
                return;
            }
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
            shopQty: product.shopQty || 0,
            warehouseQty: product.warehouseQty || 0,
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

    const updateQty = (index, qty) => {
        const item = items[index];
        const maxAvailable = item.source === 'warehouse' ? item.warehouseQty : item.shopQty;

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
        }
        else if (item.minProfitMargin > 0) {
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

        // Update maxQty based on source and reset qty if needed
        const maxAvailable = item.source === 'warehouse' ? item.warehouseQty : item.shopQty;
        if (item.qty > maxAvailable) {
            item.qty = Math.min(1, maxAvailable);
            toast.info(`تم تغيير المصدر. الكمية المتوفرة: ${maxAvailable}`);
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
            source: 'shop', // Not used but needed for consistency
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

    return (
        <div className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-6">
            <div className="flex gap-3">
                {/* Product Search */}
                <div className="relative flex-1">
                    <Label className="font-bold mb-2 block">بحث عن منتج</Label>
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
                        <Input
                            placeholder="اسم المنتج او الباركود..."
                            value={searchTerm}
                            onChange={e => handleProductSearch(e.target.value)}
                            className="h-12 pr-11 rounded-xl bg-white/5 border-white/5 focus:bg-white/10 text-base"
                            autoFocus
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-full left-0 right-0 glass-card border border-white/10 rounded-xl shadow-2xl z-50 mt-2 max-h-72 overflow-y-auto"
                        >
                            {searchResults.map(p => {
                                const qty = p.shopQty !== undefined ? p.shopQty : p.stockQty;
                                return (
                                    <div
                                        key={p._id}
                                        onClick={() => addItem(p)}
                                        className="p-4 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                                <Package className="h-5 w-5 text-purple-500" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{p.name}</div>
                                                <div className="text-xs text-muted-foreground">{p.code}</div>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-purple-500">{p.retailPrice || p.sellPrice} ج.م</div>
                                            <div className="flex gap-3 text-[10px] font-medium mt-1">
                                                <span className={`${(p.shopQty || 0) > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                                    محل: {p.shopQty || 0}
                                                </span>
                                                <span className={`${(p.warehouseQty || 0) > 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                                                    مخزن: {p.warehouseQty || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </div>

                {/* Add Service Button */}
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <Label className="font-bold mb-2 block invisible">مساحة</Label>
                        <Button
                            onClick={() => setShowProductModal(true)}
                            className="h-12 w-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2"
                        >
                            <Package className="w-5 h-5" />
                            <span className="font-bold">تصفح المنتجات</span>
                        </Button>
                    </div>
                    <div>
                        <Label className="font-bold mb-2 block invisible">مساحة</Label>
                        <Button
                            onClick={() => setShowServiceDialog(true)}
                            className="h-12 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl gap-2"
                        >
                            <Wrench className="w-4 h-4" />
                            <span className="font-bold">خدمة</span>
                        </Button>
                    </div>
                </div>
            </div>

            <ProductSelectorModal
                open={showProductModal}
                onOpenChange={setShowProductModal}
                onSelect={(product) => {
                    addItem(product);
                    toast.success(`تم إضافة ${product.name}`);
                }}
                defaultSource={defaultSource}
            />

            {/* Service Item Dialog */}

            {/* Service Item Dialog */}
            <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-amber-500" />
                            إضافة خدمة/منتج مخصص
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>اسم الخدمة/المنتج *</Label>
                            <Input
                                value={serviceForm.name}
                                onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                                placeholder="مثال: منتج خاص للعميل..."
                                className="h-11"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>سعر التكلفة (اختياري)</Label>
                                <Input
                                    type="number"
                                    value={serviceForm.costPrice}
                                    onChange={e => setServiceForm({ ...serviceForm, costPrice: e.target.value })}
                                    placeholder="0.00"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>سعر البيع *</Label>
                                <Input
                                    type="number"
                                    value={serviceForm.sellPrice}
                                    onChange={e => setServiceForm({ ...serviceForm, sellPrice: e.target.value })}
                                    placeholder="0.00"
                                    className="h-11"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>الكمية</Label>
                            <Input
                                type="number"
                                value={serviceForm.qty}
                                onChange={e => setServiceForm({ ...serviceForm, qty: e.target.value })}
                                min="1"
                                className="h-11"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowServiceDialog(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={addServiceItem} className="bg-amber-500 hover:bg-amber-600">
                            إضافة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Items Display - Card Based */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card p-12 rounded-2xl border border-white/5 text-center"
                        >
                            <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-muted-foreground">لا توجد منتجات مضافة</p>
                            <p className="text-xs text-muted-foreground mt-1">ابحث عن منتج لإضافته للفاتورة</p>
                        </motion.div>
                    ) : (
                        items.map((item, idx) => {
                            const profitMargin = item.buyPrice > 0 ? ((item.unitPrice - item.buyPrice) / item.buyPrice) * 100 : 0;
                            const isLoss = item.unitPrice < item.buyPrice;
                            const isLowMargin = item.minProfitMargin > 0 && profitMargin < item.minProfitMargin;
                            const maxAvailable = item.source === 'warehouse' ? item.warehouseQty : item.shopQty;

                            return (
                                <motion.div
                                    key={`${item.productId}-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={cn(
                                        "glass-card p-4 rounded-xl border transition-all hover:bg-white/5",
                                        item.isService ? "border-white/5" : item.source === 'warehouse'
                                            ? "border-blue-500/30 text-blue-50 bg-blue-500/5"
                                            : "border-emerald-500/30 text-emerald-50 bg-emerald-500/5"
                                    )}
                                >
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        {/* Product Info - 4 cols */}
                                        <div className="col-span-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="font-bold text-sm">{item.name || item.productName}</div>
                                                {item.isService && (
                                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded text-[9px] font-bold flex items-center gap-1">
                                                        <Wrench className="w-2.5 h-2.5" />
                                                        خدمة
                                                    </span>
                                                )}
                                            </div>
                                            {!item.isService && (
                                                <div className="flex gap-3 text-[10px] font-medium opacity-80">
                                                    <span className={item.source === 'shop' ? 'text-emerald-400 font-bold' : ''}>
                                                        محل: {item.shopQty}
                                                    </span>
                                                    <span className={item.source === 'warehouse' ? 'text-blue-400 font-bold' : ''}>
                                                        مخزن: {item.warehouseQty}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Source Selector - 2 cols (hidden for service items) */}
                                        <div className="col-span-2">
                                            {!item.isService ? (
                                                <Select
                                                    value={item.source || 'shop'}
                                                    onValueChange={(val) => updateSource(idx, val)}
                                                >
                                                    <SelectTrigger className="h-10 bg-white/10 border-white/10 rounded-lg">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="shop">
                                                            <div className="flex items-center gap-2 text-emerald-500">
                                                                <Store className="w-4 h-4" />
                                                                <span>محل</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="warehouse">
                                                            <div className="flex items-center gap-2 text-blue-500">
                                                                <Warehouse className="w-4 h-4" />
                                                                <span>مخزن</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="h-10 flex items-center justify-center text-xs text-muted-foreground">
                                                    -
                                                </div>
                                            )}
                                        </div>

                                        {/* Quantity - 2 cols */}
                                        <div className="col-span-2">
                                            <div className="space-y-1">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.qty}
                                                    onChange={e => updateQty(idx, e.target.value)}
                                                    className="h-10 text-center bg-white/5 border-white/10 rounded-lg font-bold"
                                                />
                                                <div className="text-[9px] text-center text-muted-foreground">
                                                    متوفر: {maxAvailable}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price - 2 cols */}
                                        <div className="col-span-2">
                                            <div className="space-y-1">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={e => updatePrice(idx, e.target.value)}
                                                    className={cn(
                                                        "h-10 text-center rounded-lg bg-white/5 border-white/10 font-bold",
                                                        isLoss && "border-red-500/50 bg-red-500/10",
                                                        isLowMargin && "border-amber-400/50 bg-amber-400/10"
                                                    )}
                                                />
                                                <div className={cn(
                                                    "text-[9px] font-bold text-center",
                                                    isLoss ? "text-red-500" : isLowMargin ? "text-amber-500" : "text-emerald-500"
                                                )}>
                                                    {isLoss ? '⚠️ خسارة' : `ربح ${profitMargin.toFixed(0)}%`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Total - 1.5 cols */}
                                        <div className="col-span-1.5 text-center">
                                            <div className="font-black text-lg text-purple-500">
                                                {(item.qty * item.unitPrice).toLocaleString()}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground">ج.م</div>
                                        </div>

                                        {/* Delete - 0.5 col */}
                                        <div className="col-span-0.5 flex justify-center">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-red-500 hover:bg-red-500/10 rounded-lg h-9 w-9"
                                                onClick={() => removeItem(idx)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

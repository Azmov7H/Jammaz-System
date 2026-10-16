'use client';

import { Search, Package, ShoppingCart, Trash2, Store, Warehouse, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { ProductSelector } from '@/components/products/ProductSelector';
import { useInvoiceItems } from '@/hooks/useInvoiceItems';
import { useWarehouses, usePrimaryWarehouse } from '@/hooks/useWarehouses';

export function InvoiceItemsManager({ items, setItems, onReportShortage, defaultSource = 'shop' }) {
    const {
        searchTerm, searchResults,
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
    } = useInvoiceItems({ items, setItems, onReportShortage, defaultSource });

    const { data: warehousesData } = useWarehouses();
    const { data: primaryWarehouse } = usePrimaryWarehouse();

    const warehouseLabel = (id) => {
        if (!id) return primaryWarehouse?.name || 'المخزن الرئيسي';
        return (warehousesData?.warehouses || []).find(w => w._id === id)?.name || 'مخزن';
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
                                            <div className="p-2 bg-info/10 rounded-lg group-hover:bg-info/10 transition-colors">
                                                <Package className="h-5 w-5 text-info" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{p.name}</div>
                                                <div className="text-xs text-muted-foreground">{p.code}</div>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-info">{p.retailPrice || p.sellPrice} ج.م</div>
                                            <div className="flex gap-3 text-xs font-medium mt-1">
                                                <span className={`${(p.shopQty || 0) > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                                                    محل: {p.shopQty || 0}
                                                </span>
                                                <span className={`${(p.warehouseQty || 0) > 0 ? 'text-info' : 'text-muted-foreground'}`}>
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
                            className="h-12 px-6 bg-gradient-to-r from-warning to-warning hover:from-warning hover:to-warning rounded-xl gap-2"
                        >
                            <Wrench className="w-4 h-4" />
                            <span className="font-bold">خدمة</span>
                        </Button>
                    </div>
                </div>
            </div>

            <ProductSelector
                open={showProductModal}
                onOpenChange={setShowProductModal}
                multiple
                onSelect={(product) => {
                    addItem(product);
                    toast.success(`تم إضافة ${product.name}`);
                }}
            />

            {/* Service Item Dialog */}

            {/* Service Item Dialog */}
            <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-warning" />
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
                        <Button onClick={addServiceItem} className="bg-warning hover:bg-warning">
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
                            const maxAvailable = availableQty(item);

                            return (
                                <motion.div
                                    key={`${item.productId}-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={cn(
                                        "glass-card p-4 rounded-xl border transition-all hover:bg-white/5",
                                        item.isService ? "border-white/5" : item.source === 'warehouse'
                                            ? "border-info/30 text-info bg-info/10"
                                            : "border-success/30 text-success bg-success/5"
                                    )}
                                >
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        {/* Product Info - 4 cols */}
                                        <div className="col-span-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="font-bold text-sm">{item.name || item.productName}</div>
                                                {item.isService && (
                                                    <span className="px-2 py-0.5 bg-warning/20 text-warning border border-warning/30 rounded text-xs font-bold flex items-center gap-1">
                                                        <Wrench className="w-2.5 h-2.5" />
                                                        خدمة
                                                    </span>
                                                )}
                                            </div>
                                            {!item.isService && (
                                                <div className="flex gap-3 text-xs font-medium opacity-80">
                                                    <span className={item.source === 'shop' ? 'text-success font-bold' : ''}>
                                                        محل: {item.shopQty}
                                                    </span>
                                                    <span className={item.source === 'warehouse' ? 'text-info font-bold' : ''}>
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
                                                            <div className="flex items-center gap-2 text-success">
                                                                <Store className="w-4 h-4" />
                                                                <span>محل</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="warehouse">
                                                            <div className="flex items-center gap-2 text-info">
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
                                            {!item.isService && item.source === 'warehouse' && (
                                                <Select
                                                    value={item.warehouseId || '__primary__'}
                                                    onValueChange={(val) => updateWarehouse(idx, val === '__primary__' ? null : val)}
                                                >
                                                    <SelectTrigger
                                                        data-testid="invoice-item-warehouse"
                                                        className="h-8 mt-1 text-xs bg-white/10 border-white/10 rounded-lg"
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__primary__">
                                                            <span className="text-xs">{warehouseLabel(null)}</span>
                                                        </SelectItem>
                                                        {(item.warehouseStocks || [])
                                                            .filter(s => (s.qty || 0) > 0 || String(s.warehouseId) === String(item.warehouseId))
                                                            .map(s => (
                                                                <SelectItem key={s.warehouseId} value={String(s.warehouseId)}>
                                                                    <span className="text-xs">{warehouseLabel(s.warehouseId)} ({s.qty || 0})</span>
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
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
                                                <div className="text-xs text-center text-muted-foreground">
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
                                                        isLoss && "border-destructive/50 bg-destructive/10",
                                                        isLowMargin && "border-warning/50 bg-warning/10"
                                                    )}
                                                />
                                                <div className={cn(
                                                    "text-xs font-bold text-center",
                                                    isLoss ? "text-destructive" : isLowMargin ? "text-warning" : "text-success"
                                                )}>
                                                    {isLoss ? '⚠️ خسارة' : `ربح ${profitMargin.toFixed(0)}%`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Total - 1.5 cols */}
                                        <div className="col-span-1.5 text-center">
                                            <div className="font-bold text-lg text-info">
                                                {(item.qty * item.unitPrice).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-muted-foreground">ج.م</div>
                                        </div>

                                        {/* Delete - 0.5 col */}
                                        <div className="col-span-0.5 flex justify-center">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label="حذف الصنف من الفاتورة"
                                                className="text-destructive hover:bg-destructive/10 rounded-lg h-9 w-9"
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

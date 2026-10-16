'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeftRight, Loader2, Plus, Trash2, Package, Layers, AlertCircle, Search, Warehouse } from 'lucide-react';
import { cn } from '@/utils';
import { useProducts } from '@/hooks/useProducts';
import { useWarehouses, usePrimaryWarehouse } from '@/hooks/useWarehouses';
import { ProductSelector } from '@/components/products/ProductSelector';
import { AnimatePresence, motion } from 'framer-motion';

// Warehouse-aware labels for the operation type (which side of the move the
// selected warehouse represents).
const WAREHOUSE_LABEL = {
    IN: 'المخزن المستلم (الوجهة)',
    OUT: 'المخزن المصروف منه (المصدر)',
    TRANSFER_TO_SHOP: 'المخزن المصدر',
    TRANSFER_TO_WAREHOUSE: 'المخزن الوجهة'
};

const EMPTY_FORM = {
    productId: '', type: 'IN', qty: '', note: '', warehouseId: '',
    fromWarehouseId: '', toWarehouseId: ''
};

export function StockMovementDialog({ open, onOpenChange, onSubmit, isSubmitting }) {

    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [items, setItems] = useState([]); // For bulk movements

    const { data: warehousesData } = useWarehouses();
    const { data: primaryWarehouse } = usePrimaryWarehouse();
    const additionalWarehouses = (warehousesData?.warehouses || []).filter(w => !w.isPrimary && w.isActive);

    const isInterWarehouse = formData.type === 'TRANSFER_WAREHOUSE';

    const warehouseName = (id) => {
        if (!id) return primaryWarehouse?.name || 'المخزن الرئيسي';
        return (warehousesData?.warehouses || []).find(w => w._id === id)?.name || 'مخزن';
    };

    const handleAddItem = () => {
        if (!formData.productId || !formData.qty) return;

        // Use details from selection if available
        const productName = selectedProductDetails ? selectedProductDetails.name : 'Unknown Product';

        setItems([...items, {
            productId: formData.productId,
            name: productName,
            qty: Number(formData.qty),
            note: formData.note,
            // '' → primary warehouse (backend treats null/undefined as primary)
            warehouseId: formData.warehouseId || undefined
        }]);

        // Reset product selection but keep type, warehouse and global note
        setFormData({ ...formData, productId: '', qty: '' });
        setSelectedProductDetails(null);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Inter-warehouse move: a source and a destination warehouse (blank =
        // primary). Supports a single product or a bulk list of products moved
        // together in one atomic operation.
        if (isInterWarehouse) {
            const shared = {
                type: 'TRANSFER_WAREHOUSE',
                fromWarehouseId: formData.fromWarehouseId || null,
                toWarehouseId: formData.toWarehouseId || null,
                note: formData.note
            };
            const payload = items.length > 0
                ? { ...shared, items: items.map(i => ({ productId: i.productId, qty: i.qty, note: i.note })) }
                : { ...shared, productId: formData.productId, qty: Number(formData.qty) };
            onSubmit(payload, () => {
                setFormData(EMPTY_FORM);
                setItems([]);
            });
            return;
        }
        // If we have bulk items, use them, otherwise use the single product form
        const payload = items.length > 0
            ? { items, type: formData.type, note: formData.note }
            : { ...formData, warehouseId: formData.warehouseId || undefined };

        onSubmit(payload, () => {
            // Reset callback
            setFormData(EMPTY_FORM);
            setItems([]);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="sm:max-w-[850px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-white/10 shrink-0">
                    <DialogTitle className="flex items-center gap-4 text-3xl font-bold tracking-tight">
                        <div className="p-3 bg-primary/20 rounded-2xl shadow-lg shadow-primary/20 animate-pulse">
                            <ArrowLeftRight className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span>تسجيل حركة مخزون</span>
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Manual Stock Movement</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Operation Type Selector */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-foreground/1040 backdrop-blur-xl p-6 rounded-[1.5rem] border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={14} className="opacity-50" />
                                    نوع العملية الرئيسي
                                </Label>
                                <span className="text-xs font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded-md">Unified Action</span>
                            </div>
                            <select
                                data-testid="stock-movement-type"
                                className="w-full h-14 px-5 border-2 border-white/5 rounded-2xl bg-white/[0.03] font-bold text-lg shadow-inner focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer hover:bg-white/5"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="IN" className="bg-secondary">وارد: شراء / توريد (للمخزن)</option>
                                <option value="OUT" className="bg-secondary">صادر: صرف / تالف (من المخزن)</option>
                                <option value="TRANSFER_TO_SHOP" className="bg-secondary">تحويل: من المخزن للمحل</option>
                                <option value="TRANSFER_TO_WAREHOUSE" className="bg-secondary">إرجاع: من المحل للمخزن</option>
                                <option value="TRANSFER_WAREHOUSE" className="bg-secondary">تحويل بين المخازن</option>
                            </select>

                            {isInterWarehouse ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                            <Warehouse size={14} className="opacity-50" />
                                            المخزن المصدر
                                        </Label>
                                        <select
                                            data-testid="stock-movement-from-warehouse"
                                            className="w-full h-12 px-5 border-2 border-white/5 rounded-2xl bg-white/[0.03] font-bold shadow-inner focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer hover:bg-white/5"
                                            value={formData.fromWarehouseId}
                                            onChange={e => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                                        >
                                            <option value="" className="bg-secondary">
                                                {primaryWarehouse?.name || 'المخزن الرئيسي'}
                                            </option>
                                            {additionalWarehouses.map(w => (
                                                <option key={w._id} value={w._id} className="bg-secondary">
                                                    {w.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                            <Warehouse size={14} className="opacity-50" />
                                            المخزن الوجهة
                                        </Label>
                                        <select
                                            data-testid="stock-movement-to-warehouse"
                                            className="w-full h-12 px-5 border-2 border-white/5 rounded-2xl bg-white/[0.03] font-bold shadow-inner focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer hover:bg-white/5"
                                            value={formData.toWarehouseId}
                                            onChange={e => setFormData({ ...formData, toWarehouseId: e.target.value })}
                                        >
                                            <option value="" className="bg-secondary">
                                                {primaryWarehouse?.name || 'المخزن الرئيسي'}
                                            </option>
                                            {additionalWarehouses.map(w => (
                                                <option key={w._id} value={w._id} className="bg-secondary">
                                                    {w.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                        <Warehouse size={14} className="opacity-50" />
                                        {WAREHOUSE_LABEL[formData.type] || 'المخزن'}
                                    </Label>
                                    <select
                                        data-testid="stock-movement-warehouse"
                                        className="w-full h-12 px-5 border-2 border-white/5 rounded-2xl bg-white/[0.03] font-bold shadow-inner focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer hover:bg-white/5"
                                        value={formData.warehouseId}
                                        onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
                                    >
                                        <option value="" className="bg-secondary">
                                            {primaryWarehouse?.name || 'المخزن الرئيسي'}
                                        </option>
                                        {additionalWarehouses.map(w => (
                                            <option key={w._id} value={w._id} className="bg-secondary">
                                                {w.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Adder */}
                    <div className="space-y-5 p-6 rounded-[2rem] bg-white/[0.02] border-2 border-dashed border-white/5 hover:border-primary/20 transition-all duration-500 group/adder">
                        <div className="flex items-center justify-between px-2">
                            <Label className="text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                <Package size={14} className="opacity-50" />
                                إضافة منتجات للعملية
                            </Label>
                            <span className="text-xs font-bold text-muted-foreground/40">Quick Add</span>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                {selectedProductDetails ? (
                                    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-2xl group relative overflow-hidden">
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="p-2 bg-primary/20 rounded-xl text-primary">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{selectedProductDetails.name}</p>
                                                <p className="text-xs font-bold text-muted-foreground">{selectedProductDetails.code}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsProductSelectorOpen(true)}
                                            className="font-bold relative z-10 hover:bg-white/10"
                                        >
                                            تغيير
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsProductSelectorOpen(true)}
                                        className="w-full h-12 justify-between border-dashed border-2 border-white/10 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-2xl transition-all"
                                    >
                                        <span className="flex items-center gap-2 font-bold">
                                            <Search size={16} />
                                            اختر منتج من القائمة...
                                        </span>
                                        <Plus size={16} />
                                    </Button>
                                )}
                            </div>
                            <div className="w-full lg:w-40 relative">
                                <Input
                                    type="number"
                                    placeholder="الكمية"
                                    min="1"
                                    value={formData.qty}
                                    onChange={e => setFormData({ ...formData, qty: e.target.value })}
                                    className="h-12 rounded-2xl font-bold text-center text-xl border-white/10 bg-white/[0.03] focus:border-primary focus:ring-primary/10 transition-all placeholder:text-sm placeholder:font-bold"
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleAddItem}
                                disabled={!formData.productId || !formData.qty}
                                className="h-12 px-8 rounded-2xl gap-2 font-bold text-base gradient-primary border-0 hover-lift shadow-lg shadow-primary/20 disabled:opacity-30 transition-all active:scale-95"
                            >
                                <Plus size={20} className="animate-bounce" />
                                إدراج للقائمة
                            </Button>
                        </div>
                    </div>

                    {/* Selected Items List */}
                    <AnimatePresence mode="popLayout">
                        {items.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between px-2">
                                    <Label className="text-sm font-bold text-primary/80 uppercase tracking-widest">
                                        قائمة العناصر المختارة ({items.length})
                                    </Label>
                                    <div className="h-[2px] flex-1 mx-4 bg-gradient-to-l from-primary/20 to-transparent"></div>
                                </div>
                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {items.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, x: 50 }}
                                            className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-2xl group hover:border-primary/40 hover:bg-white/[0.05] transition-all duration-300 shadow-sm"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                                                    <Package size={24} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{item.name}</p>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-bold shadow-sm">الكمية: {item.qty}</span>
                                                        {!isInterWarehouse && (
                                                            <span className="text-xs bg-info/20 text-info px-3 py-1 rounded-full font-bold shadow-sm flex items-center gap-1">
                                                                <Warehouse size={10} /> {warehouseName(item.warehouseId)}
                                                            </span>
                                                        )}
                                                        {item.note && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground font-bold italic opacity-60">
                                                                <AlertCircle size={10} />
                                                                {item.note}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label="إزالة الصنف"
                                                className="h-11 w-11 text-destructive hover:bg-destructive/10 rounded-xl hover:text-destructive transition-all active:scale-90"
                                                onClick={() => handleRemoveItem(index)}
                                            >
                                                <Trash2 size={20} />
                                            </Button>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Final Notes */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                        <Label className="text-sm font-bold text-white/40 uppercase tracking-widest px-1">ملاحظات العملية الكلية</Label>
                        <Input
                            placeholder="أدخل أي ملاحظات إضافية هنا (اختياري)..."
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                            className="h-14 rounded-2xl bg-white/[0.02] border-white/10 focus:border-primary/40 transition-all font-bold text-base px-5 shadow-inner"
                        />
                    </div>

                    {/* Action Buttons */}
                    <DialogFooter className="pt-8 border-t border-white/10 gap-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="h-14 px-10 rounded-2xl font-bold text-muted-foreground border-2 border-white/5 hover:bg-white/5 hover:text-foreground transition-all flex-1 lg:flex-none active:scale-95"
                        >
                            إلغاء الأمر
                        </Button>
                        <Button
                            type="submit"
                            className="gradient-primary border-0 h-14 px-12 rounded-2xl font-bold text-xl shadow-2xl shadow-primary/20 hover-lift flex-1 lg:min-w-[240px] relative overflow-hidden group/submit"
                            disabled={(items.length === 0 && (!formData.productId || !formData.qty)) || isSubmitting}
                        >
                            <AnimatePresence mode="wait">
                                {isSubmitting ? (
                                    <motion.div
                                        key="loader"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <Loader2 className="animate-spin w-6 h-6" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="content"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span>اعتماد وتنفيذ الحركة</span>
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 text-xs shadow-inner">
                                            {items.length > 0 ? items.length : '1'}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] translate-x-[-150%] group-hover/submit:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>

            <ProductSelector
                showFilters={false}
                open={isProductSelectorOpen}
                onOpenChange={setIsProductSelectorOpen}
                onSelect={(product) => {
                    setFormData({ ...formData, productId: product._id });
                    setSelectedProductDetails(product);
                }}
            />
        </Dialog>
    );
}

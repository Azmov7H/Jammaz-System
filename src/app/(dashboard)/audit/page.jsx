'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowRightLeft, Search, Box, ClipboardEdit, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';

export default function AuditPage() {
    // Role check to show Audit button
    const { role } = useUserRole();
    const canAudit = role === 'manager' || role === 'owner' || role === 'admin';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Transfer Modal
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [transferQty, setTransferQty] = useState('');
    const [direction, setDirection] = useState('warehouse_to_shop'); // warehouse_to_shop | shop_to_warehouse

    // Adjust/Audit Modal
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [adjustData, setAdjustData] = useState({ warehouseQty: '', shopQty: '', note: '' });
    const [isAdjusting, setIsAdjusting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [search]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/products?search=${search}&limit=50`);
            const data = await res.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- Transfer Handlers ---
    const openTransfer = (product) => {
        setSelectedProduct(product);
        setTransferQty('');
        setDirection('warehouse_to_shop');
        setIsTransferOpen(true);
    };

    const handleTransfer = async () => {
        if (!transferQty || Number(transferQty) <= 0) {
            toast.error('الكمية غير صحيحة');
            return;
        }

        const from = direction === 'warehouse_to_shop' ? 'warehouse' : 'shop';
        // Client validation
        if (from === 'warehouse' && selectedProduct.warehouseQty < Number(transferQty)) {
            toast.error('الكمية في المخزن لا تكفي');
            return;
        }
        if (from === 'shop' && selectedProduct.shopQty < Number(transferQty)) {
            toast.error('الكمية في المحل لا تكفي');
            return;
        }

        const to = direction === 'warehouse_to_shop' ? 'shop' : 'warehouse';

        try {
            const res = await fetch('/api/inventory/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct._id,
                    quantity: Number(transferQty),
                    from,
                    to
                })
            });

            if (res.ok) {
                toast.success('تم النقل بنجاح');
                setIsTransferOpen(false);
                fetchProducts();
            } else {
                const data = await res.json();
                toast.error(data.error || 'فشلت عملية النقل');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ في النظام');
        }
    };

    // --- Adjust/Audit Handlers ---
    const openAdjust = (product) => {
        setSelectedProduct(product);
        setAdjustData({
            warehouseQty: product.warehouseQty || 0,
            shopQty: product.shopQty || 0,
            note: ''
        });
        setIsAdjustOpen(true);
    };

    const handleAdjust = async () => {
        setIsAdjusting(true);
        try {
            const res = await fetch('/api/stock/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct._id,
                    warehouseQty: adjustData.warehouseQty,
                    shopQty: adjustData.shopQty,
                    note: adjustData.note
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('تم تصحيح الأرصدة بنجاح');
                setIsAdjustOpen(false);
                fetchProducts();
            } else {
                toast.error(data.error || 'فشلت عملية التصحيح');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء الاتصال');
        } finally {
            setIsAdjusting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1B3C73] flex items-center gap-2">
                <Box className="w-8 h-8" /> الجرد وحركة المخزون
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">إجمالي المخزون (قطع)</div>
                        <div className="text-2xl font-bold">{products.reduce((acc, p) => acc + (p.stockQty || 0), 0)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">رصيد المحل (قطع)</div>
                        <div className="text-2xl font-bold text-blue-600">{products.reduce((acc, p) => acc + (p.shopQty || 0), 0)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">رصيد المخزن (قطع)</div>
                        <div className="text-2xl font-bold text-amber-600">{products.reduce((acc, p) => acc + (p.warehouseQty || 0), 0)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <Input
                    placeholder="ابحث بالاسم أو الكود لتصحيح التوزيع..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pr-10 border-slate-300 focus:border-[#1B3C73]"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-right">المنتج</TableHead>
                            <TableHead className="text-center bg-blue-50/50">رصيد المحل</TableHead>
                            <TableHead className="text-center bg-amber-50/50">رصيد المخزن</TableHead>
                            <TableHead className="text-center">الإجمالي</TableHead>
                            <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">جاري التحميل...</TableCell></TableRow>
                        ) : products.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">لا توجد منتجات</TableCell></TableRow>
                        ) : (
                            products.map(product => (
                                <TableRow key={product._id}>
                                    <TableCell>
                                        <div className="font-bold">{product.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{product.code}</div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold bg-blue-50/30 text-blue-700 text-lg">
                                        {product.shopQty || 0}
                                    </TableCell>
                                    <TableCell className="text-center font-bold bg-amber-50/30 text-amber-700 text-lg">
                                        {product.warehouseQty || 0}
                                    </TableCell>
                                    <TableCell className="text-center font-bold">
                                        {product.stockQty}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <Button size="sm" variant="outline" className="gap-2" onClick={() => openTransfer(product)}>
                                                <ArrowRightLeft size={14} /> نقل
                                            </Button>
                                            {canAudit && (
                                                <Button size="sm" variant="secondary" className="gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border" onClick={() => openAdjust(product)}>
                                                    <ClipboardEdit size={14} /> تصحيح
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Transfer Dialog */}
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>نقل مخزون - {selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${direction === 'warehouse_to_shop' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                                onClick={() => setDirection('warehouse_to_shop')}
                            >
                                من المخزن ⬅ إلي المحل
                            </button>
                            <button
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${direction === 'shop_to_warehouse' ? 'bg-white shadow text-amber-600' : 'text-slate-500'}`}
                                onClick={() => setDirection('shop_to_warehouse')}
                            >
                                من المحل ⬅ إلي المخزن
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Label>الكمية المراد نقلها</Label>
                            <Input
                                type="number"
                                value={transferQty}
                                onChange={e => setTransferQty(e.target.value)}
                                placeholder="0"
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground">
                                المتوفر في المصدر: {direction === 'warehouse_to_shop' ? selectedProduct?.warehouseQty : selectedProduct?.shopQty}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTransferOpen(false)}>إلغاء</Button>
                        <Button onClick={handleTransfer} className="bg-[#1B3C73]">تأكيد النقل</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Adjust/Audit Dialog */}
            <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                <DialogContent dir="rtl" className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertCircle size={20} /> تصحيح أرصدة (جرد فعلي)
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded text-sm text-amber-800">
                            تنبيه: هذا الإجراء يقوم <strong>بتغيير الكميات مباشرة</strong> دون عملية شراء أو بيع. يستخدم فقط عند اكتشاف أخطاء في الجرد أو لتسوية المخزون.
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>رصيد المحل (الجديد)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    className="border-blue-200 focus:border-blue-500 font-bold text-center"
                                    value={adjustData.shopQty}
                                    onChange={e => setAdjustData({ ...adjustData, shopQty: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 text-center">الحالي: {selectedProduct?.shopQty}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>رصيد المخزن (الجديد)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    className="border-amber-200 focus:border-amber-500 font-bold text-center"
                                    value={adjustData.warehouseQty}
                                    onChange={e => setAdjustData({ ...adjustData, warehouseQty: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 text-center">الحالي: {selectedProduct?.warehouseQty}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>سبب التعديل (مطلوب)</Label>
                            <Input
                                placeholder="مثال: جرد سنوي، تصحيح خطأ إدخال..."
                                value={adjustData.note}
                                onChange={e => setAdjustData({ ...adjustData, note: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>إلغاء</Button>
                        <Button variant="destructive" onClick={handleAdjust} disabled={!adjustData.note || isAdjusting}>
                            {isAdjusting ? 'جاري الحفظ...' : 'حفظ الأرصدة الجديدة'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

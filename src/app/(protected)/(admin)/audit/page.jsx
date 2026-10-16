'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowRightLeft, Search, Box, ClipboardEdit, AlertCircle, Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleGate } from '@/components/auth/RoleGate';
import { hasRole, ROLES } from '@/lib/permissions';
import { cn } from '@/utils';

export default function AuditPage() {
    const { role } = useUserRole();
    const canAudit = hasRole(role, [ROLES.OWNER, ROLES.MANAGER]);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Transfer Modal
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [transferQty, setTransferQty] = useState('');
    const [direction, setDirection] = useState('warehouse_to_shop');

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
            // Backend wraps payloads in a {success,data} envelope.
            setProducts(data.data?.products || data.products || []);
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
            const res = await fetch('/api/stock/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct._id,
                    qty: Number(transferQty),
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
                toast.error(data.data?.message || data.message || 'فشلت عملية النقل');
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
        // The API sets one location per call — send one request per
        // location that actually changed.
        const calls = [];
        const newShop = Number(adjustData.shopQty);
        const newWarehouse = Number(adjustData.warehouseQty);
        if (newShop !== Number(selectedProduct.shopQty || 0)) {
            calls.push({ location: 'shop', newQty: newShop });
        }
        if (newWarehouse !== Number(selectedProduct.warehouseQty || 0)) {
            calls.push({ location: 'warehouse', newQty: newWarehouse });
        }
        if (calls.length === 0) {
            toast.error('لا يوجد تغيير في الأرصدة');
            return;
        }
        setIsAdjusting(true);
        try {
            for (const call of calls) {
                const res = await fetch('/api/stock/adjust', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: selectedProduct._id,
                        location: call.location,
                        newQty: call.newQty,
                        reason: adjustData.note
                    })
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.data?.message || data.message || 'فشلت عملية التصحيح');
                }
            }
            toast.success('تم تصحيح الأرصدة بنجاح');
            setIsAdjustOpen(false);
            fetchProducts();
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'حدث خطأ أثناء الاتصال');
        } finally {
            setIsAdjusting(false);
        }
    };

    return (
        <RoleGate roles={[ROLES.OWNER, ROLES.MANAGER, ROLES.WAREHOUSE]}>
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Box className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">الجرد وحركة المخزون</h1>
                    <p className="text-sm text-muted-foreground">نقل البضائع وتصحيح الأرصدة</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">إجمالي المخزون (قطع)</div>
                        <div className="text-2xl font-bold">{products.reduce((acc, p) => acc + (p.stockQty || 0), 0)}</div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">رصيد المحل (قطع)</div>
                        <div className="text-2xl font-bold text-primary">{products.reduce((acc, p) => acc + (p.shopQty || 0), 0)}</div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">رصيد المخزن (قطع)</div>
                        <div className="text-2xl font-bold text-warning dark:text-warning">{products.reduce((acc, p) => acc + (p.warehouseQty || 0), 0)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                    placeholder="ابحث بالاسم أو الكود لتصحيح التوزيع..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pr-10"
                />
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
                <Table aria-label="سجل التدقيق">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">المنتج</TableHead>
                            <TableHead className="text-center bg-primary/5">رصيد المحل</TableHead>
                            <TableHead className="text-center bg-warning/10 dark:bg-warning/20">رصيد المخزن</TableHead>
                            <TableHead className="text-center">الإجمالي</TableHead>
                            <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    لا توجد منتجات
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map(product => (
                                <TableRow key={product._id}>
                                    <TableCell>
                                        <div className="font-semibold">{product.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{product.code}</div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold bg-primary/5 text-primary text-lg">
                                        {product.shopQty || 0}
                                    </TableCell>
                                    <TableCell className="text-center font-bold bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning text-lg">
                                        {product.warehouseQty || 0}
                                    </TableCell>
                                    <TableCell className="text-center font-bold">
                                        {product.stockQty}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <Button size="sm" variant="outline" className="gap-1" onClick={() => openTransfer(product)}>
                                                <ArrowRightLeft size={14} /> نقل
                                            </Button>
                                            {canAudit && (
                                                <Button size="sm" variant="secondary" className="gap-1" onClick={() => openAdjust(product)}>
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
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button type="button"
                                className={cn(
                                    "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
                                    direction === 'warehouse_to_shop' ? 'bg-background shadow text-primary' : 'text-muted-foreground'
                                )}
                                onClick={() => setDirection('warehouse_to_shop')}
                            >
                                من المخزن ⬅ إلى المحل
                            </button>
                            <button type="button"
                                className={cn(
                                    "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
                                    direction === 'shop_to_warehouse' ? 'bg-background shadow text-warning' : 'text-muted-foreground'
                                )}
                                onClick={() => setDirection('shop_to_warehouse')}
                            >
                                من المحل ⬅ إلى المخزن
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
                        <Button onClick={handleTransfer}>تأكيد النقل</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Adjust/Audit Dialog */}
            <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                <DialogContent dir="rtl" className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-warning dark:text-warning">
                            <AlertCircle size={20} /> تصحيح أرصدة (جرد فعلي)
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="p-3 bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning rounded text-sm text-warning dark:text-warning">
                            تنبيه: هذا الإجراء يقوم <strong>بتغيير الكميات مباشرة</strong> دون عملية شراء أو بيع. يستخدم فقط عند اكتشاف أخطاء في الجرد.
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>رصيد المحل (الجديد)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    className="font-bold text-center"
                                    value={adjustData.shopQty}
                                    onChange={e => setAdjustData({ ...adjustData, shopQty: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground text-center">الحالي: {selectedProduct?.shopQty}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>رصيد المخزن (الجديد)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    className="font-bold text-center"
                                    value={adjustData.warehouseQty}
                                    onChange={e => setAdjustData({ ...adjustData, warehouseQty: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground text-center">الحالي: {selectedProduct?.warehouseQty}</p>
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
        </RoleGate>
    );
}

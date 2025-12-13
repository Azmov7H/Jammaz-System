'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowRightLeft, Search, Box, Store } from 'lucide-react';

export default function AuditPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Transfer Modal
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [transferQty, setTransferQty] = useState('');
    const [direction, setDirection] = useState('warehouse_to_shop'); // warehouse_to_shop | shop_to_warehouse

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
        const to = direction === 'warehouse_to_shop' ? 'shop' : 'warehouse';

        // Client validation
        if (from === 'warehouse' && selectedProduct.warehouseQty < Number(transferQty)) {
            toast.error('الكمية في المخزن لا تكفي');
            return;
        }
        if (from === 'shop' && selectedProduct.shopQty < Number(transferQty)) {
            toast.error('الكمية في المحل لا تكفي');
            return;
        }

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
                fetchProducts(); // Refresh list
            } else {
                const data = await res.json();
                toast.error(data.error || 'فشلت عملية النقل');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ في النظام');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1B3C73] flex items-center gap-2">
                <Box className="w-8 h-8" /> الجرد وحركة المخزون
            </h1>

            {/* Stats Cards (Optional place holders) */}
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
                    placeholder="ابحث بالاسم أو الكود..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pr-10"
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
                                        <div className="text-xs text-muted-foreground">{product.code}</div>
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
                                        <Button size="sm" variant="outline" className="gap-2" onClick={() => openTransfer(product)}>
                                            <ArrowRightLeft size={16} /> نقل
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Transfer Dialog */}
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>نقل مخزون - {selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${direction === 'warehouse_to_shop' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                                onClick={() => setDirection('warehouse_to_shop')}
                            >
                                مخزن ⬅ محل
                            </button>
                            <button
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${direction === 'shop_to_warehouse' ? 'bg-white shadow text-amber-600' : 'text-slate-500'}`}
                                onClick={() => setDirection('shop_to_warehouse')}
                            >
                                محل ⬅ مخزن
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
        </div>
    );
}

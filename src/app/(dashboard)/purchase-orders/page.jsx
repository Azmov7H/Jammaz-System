'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, CheckCircle, Eye, Loader2 } from 'lucide-react';
import { usePurchaseOrders, useCreatePO, useUpdatePOStatus } from '@/hooks/usePurchaseOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import Link from 'next/link';

export default function PurchaseOrdersPage() {
    // Hooks
    const { data: pos = [], isLoading: posLoading } = usePurchaseOrders();
    const { data: suppliers = [] } = useSuppliers();
    const { data: products = [] } = useProducts({ limit: 100 });
    const createMutation = useCreatePO();
    const updateMutation = useUpdatePOStatus();

    // UI State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [supplierId, setSupplierId] = useState('');
    const [poItems, setPoItems] = useState([]);

    // Temp Item State
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState('');
    const [cost, setCost] = useState('');

    const addItem = () => {
        if (!selectedProduct || !qty || !cost) return;
        const prod = products.find(p => p._id === selectedProduct);
        setPoItems([...poItems, {
            productId: selectedProduct,
            name: prod.name,
            quantity: Number(qty),
            costPrice: Number(cost)
        }]);
        setSelectedProduct('');
        setQty('');
        setCost('');
    };

    const handleCreate = () => {
        if (!supplierId || poItems.length === 0) return;
        createMutation.mutate({
            supplierId,
            items: poItems,
            notes: 'Generated via Dashboard'
        }, {
            onSuccess: () => {
                setIsDialogOpen(false);
                setSupplierId('');
                setPoItems([]);
            }
        });
    };

    const handleReceive = (id) => {
        if (!confirm('هل وصلت البضاعة؟ سيتم زيادة المخزون تلقائياً.')) return;
        updateMutation.mutate({ id, status: 'RECEIVED' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#1B3C73] flex items-center gap-2">
                    <ShoppingCart className="w-8 h-8" /> أوامر الشراء
                </h1>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-[#1B3C73] gap-2">
                    <Plus size={18} /> طلب جديد
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-right">رقم الطلب</TableHead>
                            <TableHead className="text-right">المورد</TableHead>
                            <TableHead className="text-center">التاريخ</TableHead>
                            <TableHead className="text-center">التكلفة</TableHead>
                            <TableHead className="text-center">الحالة</TableHead>
                            <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {posLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-[#1B3C73]" /></TableCell></TableRow>
                        ) : pos.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">لا توجد أوامر شراء</TableCell></TableRow>
                        ) : (
                            pos.map(po => (
                                <TableRow key={po._id}>
                                    <TableCell className="font-mono">{po.poNumber}</TableCell>
                                    <TableCell>{po.supplier?.name}</TableCell>
                                    <TableCell className="text-center text-sm">{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-center font-bold">{po.totalCost.toLocaleString()} ج.م</TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={po.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                            {po.status === 'RECEIVED' ? 'تم الاستلام' : 'قيد الانتظار'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/purchase-orders/${po._id}`}>
                                                <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50">
                                                    <Eye size={16} className="mr-1" /> عرض
                                                </Button>
                                            </Link>
                                            {po.status === 'PENDING' && (
                                                <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => handleReceive(po._id)}>
                                                    <CheckCircle size={16} className="mr-1" /> استلام
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

            {/* Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>إنشاء طلب شراء جديد</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>المورد</Label>
                            <select
                                className="w-full p-2 border rounded bg-white"
                                value={supplierId}
                                onChange={e => setSupplierId(e.target.value)}
                            >
                                <option value="">اختر المورد...</option>
                                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3 border">
                            <h4 className="font-bold text-sm text-slate-700">إضافة منتجات</h4>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 p-2 border rounded bg-white text-sm"
                                    value={selectedProduct}
                                    onChange={e => setSelectedProduct(e.target.value)}
                                >
                                    <option value="">اختر المنتج...</option>
                                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                                <Input type="number" placeholder="الكمية" className="w-20" value={qty} onChange={e => setQty(e.target.value)} />
                                <Input type="number" placeholder="التكلفة" className="w-24" value={cost} onChange={e => setCost(e.target.value)} />
                                <Button size="icon" onClick={addItem}><Plus size={18} /></Button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {poItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm bg-white p-2 border rounded">
                                        <span>{item.name}</span>
                                        <span className="text-slate-500">{item.quantity} × {item.costPrice} ج.م</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleCreate} disabled={poItems.length === 0 || createMutation.isPending} className="bg-[#1B3C73]">{createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الطلب'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
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
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SmartCombobox } from '@/components/ui/smart-combobox';
import { QuickAddProductDialog } from '@/components/products/QuickAddProductDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ExportButton } from '@/components/common/ExportButton';
import { PaymentMethodSelect } from '@/components/common/PaymentMethodSelect';

export default function PurchaseOrdersPage() {
    const searchParams = useSearchParams();
    const filterSupplierId = searchParams.get('supplierId');

    const [productSearch, setProductSearch] = useState('');
    const debouncedProductSearch = useDebounce(productSearch, 500);

    const { data: posData, isLoading: posLoading } = usePurchaseOrders(filterSupplierId ? { supplierId: filterSupplierId } : {});
    // Backend returns array directly, not wrapped in { purchaseOrders: [...] }
    const pos = Array.isArray(posData) ? posData : (posData?.purchaseOrders || []);
    const { data: suppliersData } = useSuppliers();
    const suppliers = suppliersData?.suppliers || [];
    const { data: productsData } = useProducts({
        search: debouncedProductSearch,
        limit: 50
    });
    const products = productsData?.products || [];
    const createMutation = useCreatePO();
    const updateMutation = useUpdatePOStatus();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [supplierId, setSupplierId] = useState('');
    const [paymentType, setPaymentType] = useState('cash');
    const [poItems, setPoItems] = useState([]);

    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);
    const [qty, setQty] = useState('');
    const [cost, setCost] = useState('');

    // Quick add product dialog state
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddName, setQuickAddName] = useState('');

    // Handle new product added from quick dialog
    const handleProductAdded = (newProduct) => {
        // We set the product ID immediately
        setSelectedProduct(newProduct._id);
        setSelectedProductDetails(newProduct);

        // If the product has a buy price, pre-fill the cost
        if (newProduct.buyPrice) {
            setCost(newProduct.buyPrice.toString());
        }

        // Optional: We could also manually update the local products list cache
        // to make sure the name shows up even before the refetch finishes,
        // but SmartCombobox might not support that easily without a custom option.
    };

    const addItem = () => {
        if (!selectedProduct || !qty || !cost) return;

        // Try to find the product in current list or use already stored details
        const productsList = productsData?.products || [];
        const prod = productsList.find(p => p._id === selectedProduct) || selectedProductDetails;

        if (!prod) return;

        setPoItems([...poItems, {
            productId: selectedProduct,
            name: prod.name,
            quantity: Number(qty),
            costPrice: Number(cost)
        }]);
        setSelectedProduct('');
        setSelectedProductDetails(null);
        setQty('');
        setCost('');
    };

    const handleCreate = () => {
        if (createMutation.isPending) {
            return; // Button is already disabled, but extra safety
        }
        if (!supplierId || poItems.length === 0) return;
        createMutation.mutate({
            supplierId,
            items: poItems,
            paymentType,
            notes: 'Generated via Dashboard'
        }, {
            onSuccess: () => {
                setIsDialogOpen(false);
                setSupplierId('');
                setPaymentType('cash');
                setPoItems([]);
            }
        });
    };

    const [receiveTargetId, setReceiveTargetId] = useState(null);

    const handleReceive = (id) => {
        if (updateMutation.isPending) {
            return;
        }
        setReceiveTargetId(id);
    };

    const handleConfirmReceive = () => {
        if (receiveTargetId) {
            updateMutation.mutate({ id: receiveTargetId, status: 'RECEIVED' });
        }
        setReceiveTargetId(null);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="أوامر الشراء" subtitle="طلبات التوريد من الموردين" icon={ShoppingCart}
                actions={
                    <div className="flex items-center gap-2">
                        <ExportButton type="purchaseOrders" filters={{ supplier: filterSupplierId || undefined }} />
                        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                            <Plus size={18} /> طلب جديد
                        </Button>
                    </div>
                }
            />

            <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
                <Table aria-label="أوامر الشراء">
                    <TableHeader>
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
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : pos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    لا توجد أوامر شراء
                                </TableCell>
                            </TableRow>
                        ) : (
                            pos.map(po => (
                                <TableRow key={po._id}>
                                    <TableCell className="font-mono font-semibold">{po.poNumber}</TableCell>
                                    <TableCell>{po.supplier?.name}</TableCell>
                                    <TableCell className="text-center text-sm text-muted-foreground">
                                        {new Date(po.createdAt).toLocaleDateString('ar-SA')}
                                    </TableCell>
                                    <TableCell className="text-center font-bold">
                                        {po.totalCost.toLocaleString()} ج.م
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={po.status === 'RECEIVED' ? 'default' : 'secondary'}>
                                            {po.status === 'RECEIVED' ? 'تم الاستلام' : 'قيد الانتظار'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/purchase-orders/${po._id}`}>
                                                <Button size="sm" variant="ghost">
                                                    <Eye size={16} className="ml-1" /> عرض
                                                </Button>
                                            </Link>
                                            {po.status === 'PENDING' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-success hover:bg-success/10"
                                                    onClick={() => handleReceive(po._id)}
                                                >
                                                    <CheckCircle size={16} className="ml-1" /> استلام
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
                <DialogContent className="max-w-2xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>إنشاء طلب شراء جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>المورد</Label>
                            <SmartCombobox
                                options={suppliers.map(s => ({ label: s.name, value: s._id }))}
                                value={supplierId}
                                onChange={setSupplierId}
                                placeholder="اختر المورد..."
                            />
                        </div>
                        <div>
                            <Label>طريقة الدفع</Label>
                            <PaymentMethodSelect
                                value={paymentType === 'credit' ? undefined : paymentType}
                                onValueChange={setPaymentType}
                                methods={['cash', 'wallet', 'check']}
                                placeholder="اختر وسيلة الدفع"
                            />
                        </div>
                        <div>
                            <Button
                                type="button"
                                variant={paymentType === 'credit' ? 'default' : 'outline'}
                                onClick={() => setPaymentType('credit')}
                                className="w-full"
                            >
                                آجل (دين)
                            </Button>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
                            <h4 className="font-semibold text-sm">إضافة منتجات</h4>
                            <div className="flex flex-wrap gap-2">
                                <SmartCombobox
                                    className="flex-1 min-w-[200px]"
                                    options={products.map(p => ({ label: p.name, value: p._id }))}
                                    value={selectedProduct}
                                    onChange={(val) => {
                                        setSelectedProduct(val);
                                        const p = products.find(prod => prod._id === val);
                                        if (p) setSelectedProductDetails(p);
                                    }}
                                    onSearchChange={setProductSearch}
                                    placeholder="اختر المنتج..."
                                    onCreate={(name) => {
                                        setQuickAddName(name);
                                        setQuickAddOpen(true);
                                    }}
                                />
                                <Input type="number" placeholder="الكمية" className="w-20" value={qty} onChange={e => setQty(e.target.value)} />
                                <Input type="number" placeholder="التكلفة" className="w-24" value={cost} onChange={e => setCost(e.target.value)} />
                                <Button size="icon" aria-label="إضافة صنف" onClick={addItem}><Plus size={18} /></Button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {poItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm bg-background p-2 border rounded-md">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-muted-foreground">{item.quantity} × {item.costPrice} ج.م</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleCreate} disabled={poItems.length === 0 || createMutation.isPending}>
                            {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick Add Product Dialog */}
            <QuickAddProductDialog
                open={quickAddOpen}
                onOpenChange={setQuickAddOpen}
                initialName={quickAddName}
                onSuccess={handleProductAdded}
            />

            <ConfirmDialog
                open={receiveTargetId !== null}
                onOpenChange={(open) => !open && setReceiveTargetId(null)}
                title="استلام البضاعة"
                description="هل وصلت البضاعة؟ سيتم زيادة المخزون تلقائياً."
                confirmLabel="تأكيد الاستلام"
                destructive={false}
                onConfirm={handleConfirmReceive}
            />
        </div>
    );
}

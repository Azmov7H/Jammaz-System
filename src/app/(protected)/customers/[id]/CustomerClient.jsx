'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Loader2, User, Phone, MapPin, DollarSign, Plus, Trash2,
    Coins, Link2
} from 'lucide-react';
import { UnifiedPaymentDialog } from '@/components/financial/PaymentDialog';
import { CustomerStatementTab } from '@/components/documents/CustomerStatementTab';
import { CustomerTransactionTab } from '@/components/documents/CustomerTransactionTab';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    getCustomerById,
    getCustomerPricing,
    getCustomerNetPosition,
} from '@/services/customerService';
import { getProducts } from '@/services/productService';
import { getInvoices } from '@/services/invoiceService';

export default function CustomerClient({ id }) {
    const queryClient = useQueryClient();
    const [isAddPriceOpen, setIsAddPriceOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [isUnifiedOpen, setIsUnifiedOpen] = useState(false);

    // Fetch Customer Details
    const { data: customer, isLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: ({ signal }) => getCustomerById(id, { signal })
    });

    // Fetch Custom Prices
    const { data: pricingData } = useQuery({
        queryKey: ['customer-pricing', id],
        queryFn: ({ signal }) => getCustomerPricing(id, { signal })
    });

    // Fetch Products for dropdown
    const { data: productsData } = useQuery({
        queryKey: ['products'],
        queryFn: ({ signal }) => getProducts({ limit: 100 }, { signal }),
        enabled: isAddPriceOpen
    });

    // Fetch Customer Invoices (History)
    const { data: historyData, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['customer-history', id],
        queryFn: ({ signal }) => getInvoices({ customerId: id }, { signal })
    });

    // Fetch Linked-Supplier Net Position (only when this customer is unified with a supplier)
    const { data: netPositionData, isLoading: isNetPositionLoading } = useQuery({
        queryKey: ['customer-net-position', id],
        queryFn: ({ signal }) => getCustomerNetPosition(id, { signal }),
        enabled: !!customer?.linkedSupplier
    });
    const netPosition = netPositionData?.data ?? netPositionData;

    // Mutations
    const addPriceMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/customers/${id}/pricing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: selectedProduct, price: parseFloat(customPrice) }),
            });
            if (!res.ok) throw new Error('Failed to set price');
            return res.json();
        },
        onSuccess: () => {
            toast.success('تمت إضافة السعر الخاص');
            setIsAddPriceOpen(false);
            setCustomPrice('');
            setSelectedProduct('');
            queryClient.invalidateQueries({ queryKey: ['customer-pricing', id] });
        }
    });

    const removePriceMutation = useMutation({
        mutationFn: async (productId) => {
            const res = await fetch(`/api/customers/${id}/pricing?productId=${productId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to remove price');
            return res.json();
        },
        onSuccess: () => {
            toast.success('تم حذف السعر الخاص');
            queryClient.invalidateQueries({ queryKey: ['customer-pricing', id] });
        }
    });

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!customer) return <div className="p-10 text-center">العميل غير موجود</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {customer.name}
                        <Badge variant="outline">{customer.priceType === 'wholesale' ? 'تاجــر جملة' : customer.priceType === 'special' ? 'سعر خاص' : 'عميل قطاعي'}</Badge>
                        {customer.isSupplier || customer.linkedSupplier
                            ? <Badge variant="secondary" className="font-bold"><Link2 className="h-3.5 w-3.5" /> عميل + مورد</Badge>
                            : <Badge variant="outline">عميل</Badge>}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {customer.phone || '-'}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {customer.address || '-'}</span>
                        <Button variant="outline" size="sm" asChild className="gap-2 rounded-lg font-bold">
                            <Link href="/parties">
                                <Link2 className="h-4 w-4" />
                                {customer.isSupplier || customer.linkedSupplier ? 'إدارة دور المورد' : 'إضافة دور المورد'}
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="bg-muted p-4 rounded-lg flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                    <p className={`text-2xl font-bold ${customer.balance > 0 ? 'text-destructive' : 'text-success'}`}>
                        {customer.balance?.toLocaleString()} ج.م
                    </p>
                    {customer.balance > 0 && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="bg-primary hover:bg-primary/90 text-white font-bold rounded-lg h-8 gap-2"
                            onClick={() => setIsUnifiedOpen(true)}
                        >
                            <Coins size={14} /> تحصيل الديون
                        </Button>
                    )}
                </div>
            </div>

            {customer?.linkedSupplier && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-primary" /> الرصيد الصافي الموحد (عميل ↔ مورد)
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {netPosition?.supplier?.name
                                ? `مرتبط بالمورد: ${netPosition.supplier.name}`
                                : 'رصيد العميل والمورد الموحد — يُحتسب الصافي من الفروق بين الطرفين'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isNetPositionLoading ? (
                            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
                        ) : netPosition ? (() => {
                            const net = Number(netPosition.netPosition ?? 0);
                            const side = netPosition.side === 'entityOwesUs'
                                ? 'الطرف الموحد مدين لنا'
                                : netPosition.side === 'weOweEntity'
                                    ? 'علينا للطرف الموحد'
                                    : 'متوازن الأرصدة';
                            const netColor = net > 0 ? 'text-destructive' : net < 0 ? 'text-warning' : 'text-muted-foreground';
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-1">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">رصيد العميل</span>
                                        <span className={`text-xl font-bold ${netPosition.customer?.balance > 0 ? 'text-destructive' : 'text-success'}`}>
                                            {(netPosition.customer?.balance ?? 0).toLocaleString()} ج.م
                                        </span>
                                    </div>
                                    <div className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-1">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">رصيد المورد المرتبط</span>
                                        <span className={`text-xl font-bold ${netPosition.supplier?.balance > 0 ? 'text-warning' : 'text-success'}`}>
                                            {(netPosition.supplier?.balance ?? 0).toLocaleString()} ج.م
                                        </span>
                                    </div>
                                    <div className="bg-card rounded-xl border-2 border-primary/20 p-4 flex flex-col items-center gap-1">
                                        <span className="text-xs font-bold text-primary uppercase tracking-wider">الرصيد الصافي</span>
                                        <span className={`text-2xl font-bold ${netColor}`}>
                                            {net.toLocaleString()} ج.م
                                        </span>
                                        <Badge variant={net > 0 ? 'destructive' : net < 0 ? 'secondary' : 'outline'} className="font-bold">
                                            {side}
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })() : null}
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="history" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pricing">الأسعار الخاصة</TabsTrigger>
                    <TabsTrigger value="history">سجل الفواتير</TabsTrigger>
                    <TabsTrigger value="statementDoc" className="text-primary font-bold">كشف رسمي</TabsTrigger>
                    <TabsTrigger value="transactionDoc" className="text-primary font-bold">حركات العميل</TabsTrigger>
                </TabsList>


                <TabsContent value="pricing">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>قائمة الأسعار الخاصة</CardTitle>
                                    <CardDescription>أسعار مخصصة لهذا العميل فقط تتجاوز سعر الفئة الافتراضي</CardDescription>
                                </div>
                                <Dialog open={isAddPriceOpen} onOpenChange={setIsAddPriceOpen}>
                                    <DialogTrigger asChild>
                                        <Button><Plus className="ml-2 h-4 w-4" /> إضافة منتج</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>تحديد سعر خاص</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                            <Label>المنتج</Label>
                                            <Select value={selectedProduct || 'none'} onValueChange={(val) => setSelectedProduct(val === 'none' ? '' : val)}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="اختر المنتج..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">اختر المنتج...</SelectItem>
                                                    {productsData?.products?.map((p) => (
                                                        <SelectItem key={p._id} value={p._id}>
                                                            {p.name} ({p.retailPrice} ج.م)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>السعر الخاص (ج.م)</Label>
                                                <Input
                                                    type="number"
                                                    value={customPrice}
                                                    onChange={e => setCustomPrice(e.target.value)}
                                                />
                                            </div>
                                            <Button onClick={() => addPriceMutation.mutate()} className="w-full" disabled={!selectedProduct || !customPrice}>
                                                حفظ السعر
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md">
                                <Table aria-label="فواتير العميل">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>المنتج</TableHead>
                                            <TableHead>سعر القطاعي</TableHead>
                                            <TableHead>سعر الجملة</TableHead>
                                            <TableHead className="bg-info/10">السعر الخاص للعميل</TableHead>
                                            <TableHead>إجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pricingData?.prices?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد أسعار خاصة</TableCell>
                                            </TableRow>
                                        ) : (
                                            pricingData?.prices?.map((item, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                                    <TableCell>{item.retailPrice.toLocaleString()}</TableCell>
                                                    <TableCell>{item.wholesalePrice.toLocaleString()}</TableCell>
                                                    <TableCell className="bg-info/10 font-bold text-info">{item.customPrice.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removePriceMutation.mutate(item.productId)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>سجل الفواتير</CardTitle>
                            <CardDescription>قائمة بكافة الفواتير الصادرة لهذا العميل</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md">
                                <Table aria-label="مدفوعات العميل">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>رقم الفاتورة</TableHead>
                                            <TableHead>التاريخ</TableHead>
                                            <TableHead>الإجمالي</TableHead>
                                            <TableHead>حالة الدفع</TableHead>
                                            <TableHead>إجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(historyData?.invoices || historyData)?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد فواتير مسجلة</TableCell>
                                            </TableRow>
                                        ) : (
                                            (historyData?.invoices || historyData)?.map((invoice) => (
                                                <TableRow key={invoice._id}>
                                                    <TableCell className="font-bold underline text-primary">
                                                        <Link href={`/invoices/${invoice._id}`}>
                                                            {invoice.number}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>{new Date(invoice.date).toLocaleDateString('ar-EG')}</TableCell>
                                                    <TableCell>{invoice.total?.toLocaleString()} ج.م</TableCell>
                                                    <TableCell>
                                                        <Badge variant={invoice.paymentStatus === 'paid' ? 'success' : invoice.paymentStatus === 'partial' ? 'warning' : 'destructive'}>
                                                            {invoice.paymentStatus === 'paid' ? 'مدفوعة' : invoice.paymentStatus === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/invoices/${invoice._id}`}>عرض</Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>


                <TabsContent value="statementDoc">
                    <CustomerStatementTab customerId={id} />
                </TabsContent>

                <TabsContent value="transactionDoc">
                    <CustomerTransactionTab customerId={id} />
                </TabsContent>
            </Tabs>

            <UnifiedPaymentDialog
                open={isUnifiedOpen}
                onOpenChange={setIsUnifiedOpen}
                target={{ kind: 'customer-total', customerId: id, customerName: customer.name, totalBalance: customer.balance }}
            />
        </div>
    );
}

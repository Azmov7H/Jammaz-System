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
import { Loader2, User, Phone, MapPin, DollarSign, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerClient({ id }) {
    const queryClient = useQueryClient();
    const [isAddPriceOpen, setIsAddPriceOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [customPrice, setCustomPrice] = useState('');

    // Fetch Customer Details
    const { data: customer, isLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${id}`); // Assumes this exists
            if (!res.ok) throw new Error('Failed to fetch customer');
            return res.json();
        }
    });

    // Fetch Custom Prices
    const { data: pricingData } = useQuery({
        queryKey: ['customer-pricing', id],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${id}/pricing`);
            return res.json();
        }
    });

    // Fetch Products for dropdown
    const { data: productsData } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await fetch('/api/products?limit=100');
            return res.json();
        },
        enabled: isAddPriceOpen
    });

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
            queryClient.invalidateQueries(['customer-pricing', id]);
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
            queryClient.invalidateQueries(['customer-pricing', id]);
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
                    </h1>
                    <div className="flex gap-4 mt-2 text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {customer.phone || '-'}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {customer.address || '-'}</span>
                    </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                    <p className={`text-2xl font-bold ${customer.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {customer.balance?.toLocaleString()} ج.م
                    </p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                    <TabsTrigger value="pricing">الأسعار الخاصة</TabsTrigger>
                    <TabsTrigger value="history">سجل الفواتير</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">احصائيات العميل (قيد التطوير)...</p>
                        </CardContent>
                    </Card>
                </TabsContent>

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
                                                <select
                                                    className="w-full p-2 border rounded-md"
                                                    value={selectedProduct}
                                                    onChange={e => setSelectedProduct(e.target.value)}
                                                >
                                                    <option value="">اختر المنتج...</option>
                                                    {productsData?.products?.map(p => (
                                                        <option key={p._id} value={p._id}>{p.name} ({p.retailPrice} ج.م)</option>
                                                    ))}
                                                </select>
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
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>المنتج</TableHead>
                                            <TableHead>سعر القطاعي</TableHead>
                                            <TableHead>سعر الجملة</TableHead>
                                            <TableHead className="bg-blue-50">السعر الخاص للعميل</TableHead>
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
                                                    <TableCell className="bg-blue-50 font-bold text-blue-700">{item.customPrice.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removePriceMutation.mutate(item.productId)}>
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
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">راجع صفحة "ذمم العملاء" أو "الفواتير" للتفاصيل الكاملة.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

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
import {
    Loader2, User, Phone, MapPin, DollarSign, Plus, Trash2,
    ShoppingCart, ArrowDownLeft, ArrowUpRight, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/utils';

export default function CustomerClient({ id }) {
    const queryClient = useQueryClient();
    const [isAddPriceOpen, setIsAddPriceOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [customPrice, setCustomPrice] = useState('');

    // Fetch Customer Details
    const { data: customer, isLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${id}`);
            if (!res.ok) throw new Error('Failed to fetch customer');
            const json = await res.json();
            return json.data;
        }
    });

    // Fetch Custom Prices
    const { data: pricingData } = useQuery({
        queryKey: ['customer-pricing', id],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${id}/pricing`);
            const json = await res.json();
            return json.data;
        }
    });

    // Fetch Products for dropdown
    const { data: productsData } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await fetch('/api/products?limit=100');
            const json = await res.json();
            return json.data;
        },
        enabled: isAddPriceOpen
    });

    // Fetch Customer Invoices (History)
    const { data: historyData, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['customer-history', id],
        queryFn: async () => {
            const res = await fetch(`/api/invoices?customerId=${id}`);
            const json = await res.json();
            return json.data;
        }
    });

    // Fetch Financial Statement
    const { data: statementData, isLoading: isStatementLoading } = useQuery({
        queryKey: ['customer-statement', id],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${id}/statement`);
            const json = await res.json();
            return json.data;
        }
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
                    <TabsTrigger value="statement" className="text-primary font-bold">كشف الحساب التفصيلي</TabsTrigger>
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

                <TabsContent value="statement">
                    <Card className="border-none shadow-2xl bg-card/30 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-white/5 bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-2xl font-black tracking-tight">كشف حساب تفصيلي</CardTitle>
                                    <CardDescription className="text-muted-foreground font-medium mt-1">تتبع تاريخي دقيق لكافة الحركات المالية والمديونيات</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" className="rounded-xl font-bold bg-white/5 border-white/10 hover:bg-white/10 h-11 px-6">
                                        <Plus className="ml-2 h-4 w-4" /> إضافة حركة يدوية
                                    </Button>
                                    <Button className="rounded-xl font-black bg-primary hover:bg-primary/90 h-11 px-8 shadow-lg shadow-primary/20">
                                        تصدير PDF
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isStatementLoading ? (
                                <div className="flex justify-center p-24"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/40 h-16">
                                            <TableRow className="hover:bg-transparent border-white/5">
                                                <TableHead className="w-[120px] text-right font-black text-xs uppercase tracking-widest px-8">التاريخ</TableHead>
                                                <TableHead className="text-right font-black text-xs uppercase tracking-widest">نوع الحركة / البيان</TableHead>
                                                <TableHead className="text-center font-black text-xs uppercase tracking-widest text-red-500 bg-red-500/5">مدين (+)</TableHead>
                                                <TableHead className="text-center font-black text-xs uppercase tracking-widest text-emerald-500 bg-emerald-500/5">دائن (-)</TableHead>
                                                <TableHead className="text-center font-black text-xs uppercase tracking-widest bg-primary/5">الرصيد التراكمي</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {statementData?.statement?.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center h-64 text-muted-foreground font-bold italic opacity-50">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <Activity className="w-16 h-16 opacity-20" />
                                                            <span>لا توجد حركات مالية مسجلة لهذا العميل حتى الآن</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                statementData?.statement?.map((entry, idx) => (
                                                    <TableRow key={idx} className="h-20 border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                        <TableCell className="px-8">
                                                            <div className="flex flex-col">
                                                                <span className="font-mono font-bold text-sm text-foreground/80">
                                                                    {new Date(entry.date).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                                    {new Date(entry.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
                                                                    entry.type === 'SALES' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                        entry.type === 'PAYMENT' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                                            "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                                )}>
                                                                    {entry.type === 'SALES' ? <ShoppingCart className="w-5 h-5" /> :
                                                                        entry.type === 'PAYMENT' ? <ArrowDownLeft className="w-5 h-5" /> :
                                                                            <ArrowUpRight className="w-5 h-5" />
                                                                    }
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    {entry.type === 'PAYMENT' || entry.type === 'REFUND' ? (
                                                                        <Link href={`/financial/receipts/${entry.referenceId}`} className="hover:text-primary transition-colors cursor-pointer">
                                                                            <span className="font-black text-base tracking-tight">{entry.label}</span>
                                                                        </Link>
                                                                    ) : (
                                                                        <span className="font-black text-base tracking-tight">{entry.label}</span>
                                                                    )}
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className="text-[9px] h-4 font-black bg-white/5 border-white/10 px-1.5 opacity-60">
                                                                            {entry.type === 'SALES' ? 'فاتورة مبيعات' :
                                                                                entry.type === 'PAYMENT' ? 'تحصيل دفعة' :
                                                                                    entry.type === 'DEBT_START' ? 'رصيد افتتاحي' : 'ارتجاع'}
                                                                        </Badge>
                                                                        {entry.referenceId && (
                                                                            <span className="text-[10px] text-muted-foreground/40 font-mono">#{entry.referenceId.toString().slice(-6).toUpperCase()}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center bg-red-500/[0.02]">
                                                            <span className={cn(
                                                                "font-mono font-black text-lg",
                                                                entry.debit > 0 ? "text-red-500" : "text-muted-foreground/20"
                                                            )}>
                                                                {entry.debit > 0 ? `+${entry.debit.toLocaleString()}` : '---'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-center bg-emerald-500/[0.02]">
                                                            <span className={cn(
                                                                "font-mono font-black text-lg",
                                                                entry.credit > 0 ? "text-emerald-500" : "text-muted-foreground/20"
                                                            )}>
                                                                {entry.credit > 0 ? `-${entry.credit.toLocaleString()}` : '---'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-center bg-primary/[0.02] border-r border-white/5">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className={cn(
                                                                    "text-xl font-black font-mono tracking-tighter",
                                                                    entry.balance > 0 ? "text-red-500" : "text-emerald-500"
                                                                )}>
                                                                    {entry.balance.toLocaleString()}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-muted-foreground mt-1">ج.م</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

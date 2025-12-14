'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Wallet, Filter, Loader2, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ReceivablesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNote, setPaymentNote] = useState('');
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Fetch unpaid invoices
    const { data, isLoading, error } = useQuery({
        queryKey: ['receivables'],
        queryFn: async () => {
            const res = await fetch('/api/payments');
            if (!res.ok) throw new Error('Failed to fetch data');
            return res.json();
        },
    });

    // Make Payment Mutation
    const paymentMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: selectedInvoice._id,
                    amount: parseFloat(paymentAmount),
                    method: paymentMethod,
                    note: paymentNote
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to record payment');
            return data;
        },
        onSuccess: () => {
            toast.success('تم تسجيل الدفعة بنجاح');
            setIsPaymentOpen(false);
            setPaymentAmount('');
            setPaymentNote('');
            setSelectedInvoice(null);
            queryClient.invalidateQueries(['receivables']);
        },
        onError: (err) => toast.error(err.message),
    });

    const filteredInvoices = data?.invoices?.filter(inv =>
        inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
        inv.number.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const openPaymentDialog = (invoice) => {
        const remaining = invoice.total - invoice.paidAmount;
        setSelectedInvoice(invoice);
        setPaymentAmount(remaining.toString());
        setIsPaymentOpen(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">ذمم العملاء (الديون)</h1>
                <p className="text-muted-foreground mt-2">
                    متابعة الفواتير الآجلة وتحصيل الدفعات
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">إجمالي الديون المستحقة</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {data?.totalReceivables?.toLocaleString()} ج.م
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">عدد الفواتير المفتوحة</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data?.count || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>الفواتير غير المدفوعة</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث باسم العميل أو رقم الفاتورة..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pr-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>رقم الفاتورة</TableHead>
                                        <TableHead>العميل</TableHead>
                                        <TableHead>تاريخ الاستحقاق</TableHead>
                                        <TableHead>المبلغ الإجمالي</TableHead>
                                        <TableHead>المدفوع</TableHead>
                                        <TableHead>المتبقي</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead>إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                                لا توجد ديون مستحقة
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredInvoices.map((inv) => {
                                            const remaining = inv.total - inv.paidAmount;
                                            const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();

                                            return (
                                                <TableRow key={inv._id}>
                                                    <TableCell className="font-medium">{inv.number}</TableCell>
                                                    <TableCell>
                                                        <div>{inv.customerName}</div>
                                                        <div className="text-xs text-muted-foreground">{inv.customer?.phone}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {inv.dueDate ? (
                                                            <span className={isOverdue ? "text-red-500 font-bold" : ""}>
                                                                {format(new Date(inv.dueDate), 'dd MMMM', { locale: ar })}
                                                            </span>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell>{inv.total.toLocaleString()}</TableCell>
                                                    <TableCell className="text-green-600">{inv.paidAmount.toLocaleString()}</TableCell>
                                                    <TableCell className="font-bold text-red-600">{remaining.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={inv.paymentStatus === 'partial' ? 'secondary' : 'outline'}>
                                                            {inv.paymentStatus === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button size="sm" onClick={() => openPaymentDialog(inv)}>
                                                            <Wallet className="ml-2 h-4 w-4" />
                                                            تحصيل
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تسجيل دفعة</DialogTitle>
                        <CardDescription>
                            تسجيل دفعة للفاتورة {selectedInvoice?.number} للعميل {selectedInvoice?.customerName}
                        </CardDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded-lg text-center">
                                <span className="text-xs text-muted-foreground block">إجمالي الفاتورة</span>
                                <span className="font-bold">{selectedInvoice?.total.toLocaleString()}</span>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg text-center border border-red-100">
                                <span className="text-xs text-red-600 block">المبلغ المتبقي</span>
                                <span className="font-bold text-red-700">
                                    {(selectedInvoice ? selectedInvoice.total - selectedInvoice.paidAmount : 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>مبلغ الدفعة</Label>
                            <Input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>طريقة الدفع</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">نقداً (الخزينة)</SelectItem>
                                    <SelectItem value="bank">تحويل بنكي</SelectItem>
                                    <SelectItem value="check">شيك</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Textarea
                                value={paymentNote}
                                onChange={(e) => setPaymentNote(e.target.value)}
                                placeholder="رقم الشيك أو الحوالة..."
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={() => paymentMutation.mutate()}
                            disabled={paymentMutation.isPending || !paymentAmount}
                        >
                            {paymentMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            تأكيد الدفع
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

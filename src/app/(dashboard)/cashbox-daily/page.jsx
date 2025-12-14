'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Minus, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

export default function CashboxPage() {
    const queryClient = useQueryClient();
    const [isIncomeOpen, setIsIncomeOpen] = useState(false);
    const [isExpenseOpen, setIsExpenseOpen] = useState(false);

    // Form States
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');

    // Fetch transactions (using accounting entries filter)
    const { data: transactions, isLoading } = useQuery({
        queryKey: ['cashbox-transactions'],
        queryFn: async () => {
            const res = await fetch('/api/accounting/entries?account=الخزينة / النقدية&limit=50');
            return res.json();
        }
    });

    const transactionMutation = useMutation({
        mutationFn: async (data) => {
            const res = await fetch('/api/cashbox/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to record transaction');
            return res.json();
        },
        onSuccess: () => {
            toast.success('تم تسجيل العملية بنجاح');
            setIsIncomeOpen(false);
            setIsExpenseOpen(false);
            setAmount('');
            setDescription('');
            setCategory('');
            queryClient.invalidateQueries(['cashbox-transactions']);
        },
        onError: (err) => toast.error(err.message),
    });

    const handleSubmit = (type) => {
        if (!amount || !description) return;
        transactionMutation.mutate({
            type,
            amount: parseFloat(amount),
            description,
            category
        });
    };

    // Calculate totals
    const entries = transactions?.entries || [];
    const totalIncome = entries.reduce((sum, e) => e.debitAccount.includes('الخزينة') ? sum + e.amount : sum, 0);
    const totalExpense = entries.reduce((sum, e) => e.creditAccount.includes('الخزينة') ? sum + e.amount : sum, 0);
    const currentBalance = totalIncome - totalExpense;

    /*
    Note: Real implementation should likely fetch "Opening Balance" from a Treasury snapshot 
    and calculate "Current Balance" based on that + today's transactions.
    For now, we calculate specific running balance from fetched entries for specific view, 
    but in production display "Today's" metrics separately.
    */

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">الخزينة اليومية</h1>
                    <p className="text-muted-foreground mt-2">
                        إدارة حركة النقدية والمصروفات
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => setIsIncomeOpen(true)}
                    >
                        <Plus className="ml-2 h-4 w-4" />
                        إيداع نقدي
                    </Button>
                    <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setIsExpenseOpen(true)}
                    >
                        <Minus className="ml-2 h-4 w-4" />
                        تسجيل مصروف
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-900">الرصيد الحالي</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 flex items-center gap-2">
                            <Wallet className="h-6 w-6" />
                            {currentBalance.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-900">مقبوضات</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700 flex items-center gap-2">
                            <TrendingUp className="h-6 w-6" />
                            {totalIncome.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-900">مدفوعات / مصروفات</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700 flex items-center gap-2">
                            <TrendingDown className="h-6 w-6" />
                            {totalExpense.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>أحدث العمليات</CardTitle>
                    <CardDescription>سجل حركة النقدية (وارد / صادر)</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="space-y-4">
                            {entries.map((entry) => {
                                const isIncome = entry.debitAccount.includes('الخزينة');
                                return (
                                    <div key={entry._id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {isIncome ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {entry.refType === 'Invoice' ? (
                                                        <a href={`/invoices/${entry.refId}`} className="hover:underline text-primary hover:text-blue-700">
                                                            {entry.description}
                                                        </a>
                                                    ) : entry.refType === 'PurchaseOrder' ? (
                                                        <a href={`/purchase-orders/${entry.refId}`} className="hover:underline text-primary hover:text-blue-700">
                                                            {entry.description}
                                                        </a>
                                                    ) : (
                                                        entry.description
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{format(new Date(entry.date), 'dd MMMM yyyy - HH:mm', { locale: ar })}</div>
                                            </div>
                                        </div>
                                        <div className={`font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                            {isIncome ? '+' : '-'}{entry.amount.toLocaleString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Income Dialog */}
            <Dialog open={isIncomeOpen} onOpenChange={setIsIncomeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تسجيل إيراد / مقبوضات</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>المبلغ</Label>
                            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>البيان / الوصف</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: إيراد غير مسجل، استرداد مبلغ..." />
                        </div>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleSubmit('income')} disabled={transactionMutation.isPending}>
                            تأكيد الإيداع
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Expense Dialog */}
            <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تسجيل مصروف</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>المبلغ</Label>
                            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>تصنيف المصروف</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rent">إيجار</SelectItem>
                                    <SelectItem value="utilities">كهرباء وماء</SelectItem>
                                    <SelectItem value="salaries">رواتب</SelectItem>
                                    <SelectItem value="supplies">لوازم وتشغيل</SelectItem>
                                    <SelectItem value="other">أخرى</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>البيان / الوصف</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => handleSubmit('expense')} disabled={transactionMutation.isPending}>
                            تأكيد الصرف
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

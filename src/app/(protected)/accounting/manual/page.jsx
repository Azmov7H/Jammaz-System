'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, ArrowRight, Wallet, TrendingUp, TrendingDown,
    FileText, Calendar, DollarSign, CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/utils';
import { format } from 'date-fns';

// Simplified categories for the user
const EXPENSE_CATEGORIES = [
    { label: 'إيجار', account: 'مصروف الإيجار' },
    { label: 'كهرباء وماء', account: 'مصروف الكهرباء والماء' },
    { label: 'رواتب ومكافآت', account: 'مصروف الرواتب' },
    { label: 'لوازم وتشغيل', account: 'مصروف اللوازم' },
    { label: 'مصروفات أخرى', account: 'مصروفات أخرى' },
];

const INCOME_CATEGORIES = [
    { label: 'إيرادات أخرى', account: 'إيرادات أخرى' },
    { label: 'فوائض تسوية', account: 'إيرادات الفوائض' },
];

export default function ManualEntryPage() {
    const queryClient = useQueryClient();
    const [type, setType] = useState('EXPENSE'); // EXPENSE or INCOME
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash'); // cash or bank
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        setDate(format(new Date(), 'yyyy-MM-dd'));
    }, []);

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const res = await fetch('/api/accounting/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to create entry');
            return result;
        },
        onSuccess: () => {
            toast.success('تم تسجيل المعاملة بنجاح', {
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            });
            // Reset form
            setAmount('');
            setDescription('');
            setCategory('');
            queryClient.invalidateQueries(['accounting-entries']);
        },
        onError: (err) => toast.error(err.message)
    });

    const handleSubmit = () => {
        // Prevent duplicate submissions
        if (createMutation.isPending) {
            toast.warning('جاري معالجة المعاملة، يرجى الانتظار...');
            return;
        }

        if (!amount || !category || !description) {
            toast.error('يرجى تعبئة جميع الحقول المطلوبة');
            return;
        }

        const isExpense = type === 'EXPENSE';

        // Determine structure based on type
        // Expense: Dr Expense Account, Cr Cash/Bank
        // Income: Dr Cash/Bank, Cr Revenue Account

        const cashAccount = paymentMethod === 'cash' ? 'الخزينة / النقدية' : 'البنك / الحساب البنكي';

        const payload = {
            type,
            amount: parseFloat(amount),
            description,
            date: new Date(date),
            debitAccount: isExpense ? category : cashAccount,
            creditAccount: isExpense ? cashAccount : category,
        };

        createMutation.mutate(payload);
    };

    return (
        <div className="min-h-screen space-y-8 p-6 pb-20 max-w-5xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/accounting">
                    <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10">
                        <ArrowRight size={20} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight">تسجيل مصروفات / إيرادات</h1>
                    <p className="text-muted-foreground font-medium">إدخال يدوي للمعاملات المالية المباشرة</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Section */}
                <Card className="glass-card p-6 md:p-8 rounded-[2.5rem] border-white/5 space-y-8">
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-4 p-1 bg-white/5 rounded-2xl">
                        <button
                            onClick={() => { setType('EXPENSE'); setCategory(''); }}
                            className={cn(
                                "flex items-center justify-center gap-3 h-14 rounded-xl font-black transition-all",
                                type === 'EXPENSE' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <TrendingDown size={20} />
                            تسجيل مصروف
                        </button>
                        <button
                            onClick={() => { setType('INCOME'); setCategory(''); }}
                            className={cn(
                                "flex items-center justify-center gap-3 h-14 rounded-xl font-black transition-all",
                                type === 'INCOME' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <TrendingUp size={20} />
                            تسجيل إيراد
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Amount */}
                        <div className="space-y-3">
                            <Label className="font-bold text-base flex items-center gap-2">
                                <DollarSign size={18} className={type === 'EXPENSE' ? "text-rose-500" : "text-emerald-500"} />
                                المبلغ
                            </Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="h-16 rounded-2xl bg-white/5 border-white/5 text-2xl font-black font-mono pl-14"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <span className="absolute left-6 top-5 text-sm font-bold opacity-40">EGP</span>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-3">
                            <Label className="font-bold text-base flex items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                نوع المعاملة (الحساب)
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/5 text-lg font-bold">
                                    <SelectValue placeholder="اختر التصنيف..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-white/10">
                                    {(type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                                        <SelectItem key={cat.account} value={cat.account} className="font-medium text-right" dir="rtl">
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <Label className="font-bold text-base flex items-center gap-2">
                                <Wallet size={18} className="text-amber-500" />
                                طريقة الدفع / التحصيل
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer",
                                    paymentMethod === 'cash' ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                                )} onClick={() => setPaymentMethod('cash')}>
                                    <span className="font-bold">الخزينة (نقدي)</span>
                                    <div className={cn("h-4 w-4 rounded-full border-2", paymentMethod === 'cash' ? "border-primary bg-primary" : "border-muted")} />
                                </div>
                                <div className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer",
                                    paymentMethod === 'bank' ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                                )} onClick={() => setPaymentMethod('bank')}>
                                    <span className="font-bold">البنك (تحويل)</span>
                                    <div className={cn("h-4 w-4 rounded-full border-2", paymentMethod === 'bank' ? "border-primary bg-primary" : "border-muted")} />
                                </div>
                            </div>
                        </div>

                        {/* Date & Description */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-3">
                                <Label className="font-bold">التاريخ</Label>
                                <Input
                                    type="date"
                                    className="h-14 rounded-2xl bg-white/5 border-white/5 font-bold"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="font-bold">البيان / التفاصيل</Label>
                                <Textarea
                                    className="min-h-[100px] rounded-2xl bg-white/5 border-white/5 resize-none text-base"
                                    placeholder="وصف مختصر للمعاملة..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            className={cn(
                                "w-full h-16 rounded-2xl text-xl font-black shadow-lg hover:scale-[1.02] transition-all",
                                type === 'EXPENSE' ? "bg-rose-500 shadow-rose-500/20 hover:bg-rose-600" : "bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600"
                            )}
                            onClick={handleSubmit}
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" /> : 'حفظ المعاملة'}
                        </Button>
                    </div>
                </Card>

                {/* Preview / Info Section */}
                <div className="space-y-6">
                    <Card className="glass-card p-6 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <CheckCircle2 size={24} className="text-primary" />
                            معاينة القيد المحاسبي
                        </h3>
                        <div className="space-y-4 font-mono text-sm bg-black/20 p-6 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center text-muted-foreground">
                                <span>التاريخ:</span>
                                <span className="font-black text-foreground">{date}</span>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-400 font-bold">مدين (Debit)</span>
                                    <span>{type === 'EXPENSE' ? (category || '---') : (paymentMethod === 'cash' ? 'الخزينة' : 'البنك')}</span>
                                </div>
                                <div className="flex justify-between items-center text-xl font-black">
                                    <span></span>
                                    <span>{amount ? parseFloat(amount).toLocaleString() : '0.00'}</span>
                                </div>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-emerald-400 font-bold">دائن (Credit)</span>
                                    <span>{type === 'EXPENSE' ? (paymentMethod === 'cash' ? 'الخزينة' : 'البنك') : (category || '---')}</span>
                                </div>
                                <div className="flex justify-between items-center text-xl font-black">
                                    <span></span>
                                    <span>{amount ? parseFloat(amount).toLocaleString() : '0.00'}</span>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-xs font-bold text-muted-foreground opacity-60 px-2 leading-relaxed">
                            تنويه: سيتم إنشاء قيد يومية تلقائي بهذه البيانات وتحديث أرصدة الحسابات المعنية (الخزينة/المصروفات/الإيرادات) فور الحفظ.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}

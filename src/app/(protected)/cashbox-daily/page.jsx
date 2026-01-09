'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Loader2, Plus, Minus, Wallet, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownRight, Banknote, Calendar,
    FileText, Tag, DollarSign, WalletCards
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CashboxPage() {
    const queryClient = useQueryClient();
    const [isIncomeOpen, setIsIncomeOpen] = useState(false);
    const [isExpenseOpen, setIsExpenseOpen] = useState(false);

    // Form States
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');

    // Fetch transactions
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

    // Calculate totals & stats
    const entries = transactions?.entries || [];
    const totalIncome = entries.reduce((sum, e) => e.debitAccount.includes('الخزينة') ? sum + e.amount : sum, 0);
    const totalExpense = entries.reduce((sum, e) => e.creditAccount.includes('الخزينة') ? sum + e.amount : sum, 0);
    const currentBalance = totalIncome - totalExpense;

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-6" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <WalletCards className="h-8 w-8 text-blue-700" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black  tracking-tight">الخزينة اليومية</h1>
                            <p className="text-muted-foreground font-medium">إدارة السيولة النقدية والمصروفات اليومية</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-3 w-full lg:w-auto"
                >
                    <Button
                        onClick={() => setIsIncomeOpen(true)}
                        className="flex-1 lg:flex-none h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="ml-2 h-5 w-5" />
                        إيداع نقدي
                    </Button>
                    <Button
                        onClick={() => setIsExpenseOpen(true)}
                        className="flex-1 lg:flex-none h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20"
                    >
                        <Minus className="ml-2 h-5 w-5" />
                        تسجيل مصروف
                    </Button>
                </motion.div>
            </div>

            {/* Wallet Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-1 glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 h-full flex flex-col justify-between min-h-[180px]">
                        <div className="flex justify-between items-start opacity-80">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Wallet className="h-6 w-6 text-blue-700" />
                            </div>
                            <span className="font-mono text-sm tracking-widest text-blue-700 opacity-60">CASH WALLET</span>
                        </div>

                        <div>
                            <p className="text-sm font-medium opacity-80 mb-1">الرصيد الحالي</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-5xl font-black text-blue-700 tracking-tight">{currentBalance.toLocaleString()}</h2>
                                <span className="text-xl font-bold text-blue-700 opacity-80">ج.م</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Income & Expense Stats */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5 group hover:bg-emerald-500/10 transition-all"
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">وارد اليوم</Badge>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase opacity-60 mb-1">إجمالي المقبوضات</p>
                            <h3 className="text-3xl font-black text-emerald-500 flex items-center gap-2">
                                +{totalIncome.toLocaleString()} <span className="text-base text-muted-foreground">ج.م</span>
                            </h3>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-6 rounded-[2.5rem] border border-red-500/20 bg-red-500/5 group hover:bg-red-500/10 transition-all"
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
                                <TrendingDown className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">منصرف اليوم</Badge>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase opacity-60 mb-1">إجمالي المدفوعات</p>
                            <h3 className="text-3xl font-black text-red-500 flex items-center gap-2">
                                -{totalExpense.toLocaleString()} <span className="text-base text-muted-foreground">ج.م</span>
                            </h3>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Transactions Feed */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <h3 className="text-lg font-black text-foreground">العمليات الأخيرة</h3>
                    <div className="h-1 flex-1 bg-white/5 rounded-full mx-4" />
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
                ) : (
                    <div className="grid gap-3">
                        <AnimatePresence mode="popLayout">
                            {entries.map((entry, i) => {
                                const isIncome = entry.debitAccount.includes('الخزينة');
                                return (
                                    <motion.div
                                        key={entry._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="glass-card p-4 rounded-[1.5rem] border border-white/5 hover:bg-white/5 transition-all group"
                                    >
                                        <div className="flex flex-col md:flex-row items-center gap-4">
                                            {/* Icon */}
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                                                isIncome ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20" : "bg-red-500/10 text-red-500 group-hover:bg-red-500/20"
                                            )}>
                                                {isIncome ? <ArrowDownRight className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 text-center md:text-right">
                                                <h4 className="font-bold text-foreground text-lg mb-1">{entry.description}</h4>
                                                <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-medium text-muted-foreground">
                                                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(entry.date), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                                                    </span>
                                                    {entry.refType && (
                                                        <span className="flex items-center gap-1 uppercase tracking-wider opacity-60">
                                                            <Tag className="h-3 w-3" />
                                                            {entry.refType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className={cn(
                                                "min-w-[120px] text-center md:text-right font-black text-xl",
                                                isIncome ? "text-emerald-500" : "text-red-500"
                                            )}>
                                                {isIncome ? '+' : '-'} {entry.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Income Dialog */}
            <Dialog open={isIncomeOpen} onOpenChange={setIsIncomeOpen}>
                <DialogContent className="sm:max-w-[425px] glass-card border-white/10 p-0 rounded-[2rem] overflow-hidden" dir="rtl">
                    <div className="bg-emerald-600 p-6 text-white text-center">
                        <DialogHeader>
                            <div className="mx-auto w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 text-white backdrop-blur-md">
                                <ArrowDownRight className="h-6 w-6" />
                            </div>
                            <DialogTitle className="text-xl font-black">إيداع نقدي جديد</DialogTitle>
                            <DialogDescription className="text-emerald-100 font-medium">تسجيل واردات نقدية للخزينة</DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-4 bg-[#0f172a]">
                        <div className="space-y-2">
                            <Label className="font-bold">المبلغ (ج.م)</Label>
                            <div className="relative">
                                <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-14 pr-12 text-xl font-bold rounded-2xl bg-white/5 border-white/5"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">التفاصيل</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="سبب الإيداع..."
                                className="min-h-[100px] rounded-2xl bg-white/5 border-white/5 resize-none font-medium"
                            />
                        </div>
                        <Button
                            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-lg"
                            onClick={() => handleSubmit('income')}
                            disabled={transactionMutation.isPending}
                        >
                            {transactionMutation.isPending ? <Loader2 className="animate-spin" /> : 'تأكيد الإيداع'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Expense Dialog */}
            <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                <DialogContent className="sm:max-w-[425px] glass-card border-white/10 p-0 rounded-[2rem] overflow-hidden" dir="rtl">
                    <div className="bg-red-600 p-6 text-white text-center">
                        <DialogHeader>
                            <div className="mx-auto w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 text-white backdrop-blur-md">
                                <ArrowUpRight className="h-6 w-6" />
                            </div>
                            <DialogTitle className="text-xl font-black">تسجيل مصروف</DialogTitle>
                            <DialogDescription className="text-red-100 font-medium">خصم مبلغ من الخزينة لمصروفات</DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-4 bg-[#0f172a]">
                        <div className="space-y-2">
                            <Label className="font-bold">المبلغ (ج.م)</Label>
                            <div className="relative">
                                <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-14 pr-12 text-xl font-bold rounded-2xl bg-white/5 border-white/5"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">نوع المصروف</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/5 font-bold">
                                    <SelectValue placeholder="اختر التصنيف" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-white/10 bg-[#1e293b]">
                                    <SelectItem value="rent">🏢 إيجار</SelectItem>
                                    <SelectItem value="utilities">⚡ كهرباء وماء</SelectItem>
                                    <SelectItem value="salaries">👥 رواتب</SelectItem>
                                    <SelectItem value="supplies">📦 لوازم وتشغيل</SelectItem>
                                    <SelectItem value="other">📝 أخرى</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">التفاصيل</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="تفاصيل المصروف..."
                                className="min-h-[80px] rounded-2xl bg-white/5 border-white/5 resize-none font-medium"
                            />
                        </div>
                        <Button
                            className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-lg"
                            onClick={() => handleSubmit('expense')}
                            disabled={transactionMutation.isPending}
                        >
                            {transactionMutation.isPending ? <Loader2 className="animate-spin" /> : 'تأكيد الصرف'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

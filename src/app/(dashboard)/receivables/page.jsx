'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Search, Wallet, Filter, Loader2,
    Calendar, User, AlertCircle, CheckCircle2,
    Banknote, CreditCard, Building2, TrendingDown,
    ArrowUpRight, Copy, DollarSign, Clock, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ReceivablesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNote, setPaymentNote] = useState('');
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Fetch unpaid invoices
    const { data, isLoading } = useQuery({
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
            toast.success('تم تسجيل الدفعة بنجاح', {
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            });
            setIsPaymentOpen(false);
            setPaymentAmount('');
            setPaymentNote('');
            setSelectedInvoice(null);
            queryClient.invalidateQueries(['receivables']);
        },
        onError: (err) => toast.error(err.message),
    });

    const filteredInvoices = useMemo(() => {
        return data?.invoices?.filter(inv =>
            inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
            inv.number.toLowerCase().includes(search.toLowerCase())
        ) || [];
    }, [data?.invoices, search]);

    const openPaymentDialog = (invoice) => {
        const remaining = invoice.total - invoice.paidAmount;
        setSelectedInvoice(invoice);
        setPaymentAmount(remaining.toString());
        setIsPaymentOpen(true);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('تم النسخ للحافظة');
    };

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-6" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500/10 rounded-2xl">
                            <Wallet className="h-8 w-8 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tight">ذمم العملاء (الديون)</h1>
                            <p className="text-muted-foreground font-medium">متابعة الفواتير الآجلة وتحصيل الدفعات المستحقة</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-[2rem] border border-red-500/10 bg-red-500/5 relative overflow-hidden group"
                >
                    <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-red-500/20 transition-all duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-red-500/80 uppercase tracking-wider">إجمالي الديون</h3>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-foreground">{data?.totalReceivables?.toLocaleString()}</span>
                            <span className="text-lg font-bold text-muted-foreground">ج.م</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-[2rem] border border-white/10 group hover:border-primary/20 transition-all"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            <FileText className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">الفواتير المفتوحة</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-foreground">{data?.count || 0}</span>
                        <span className="text-lg font-bold text-muted-foreground">فاتورة</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6 rounded-[2rem] border border-white/10 group hover:border-amber-500/20 transition-all"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">متأخرة السداد</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-foreground">{data?.invoices?.filter(i => new Date(i.dueDate) < new Date()).length || 0}</span>
                        <span className="text-lg font-bold text-muted-foreground">فاتورة</span>
                    </div>
                </motion.div>
            </div>

            {/* Search & Filter */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-2 pr-4 rounded-[1.5rem] border border-white/10 flex items-center gap-4"
            >
                <Search className="text-muted-foreground h-5 w-5" />
                <Input
                    placeholder="بحث باسم العميل أو رقم الفاتورة..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-none bg-transparent h-12 text-lg font-medium focus-visible:ring-0 px-0"
                />
            </motion.div>

            {/* Invoices List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-bold text-muted-foreground">جاري تحميل الذمم...</p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card p-12 rounded-[2.5rem] text-center border border-white/10 flex flex-col items-center gap-6"
                    >
                        <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500 opacity-50" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">لا توجد ديون مستحقة</h3>
                            <p className="text-muted-foreground mt-2 font-medium">جميع الفواتير مدفوعة بالكامل ✅</p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        <AnimatePresence mode="popLayout">
                            {filteredInvoices.map((inv, i) => {
                                const remaining = inv.total - inv.paidAmount;
                                const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();

                                return (
                                    <motion.div
                                        key={inv._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="glass-card p-5 rounded-[2rem] border border-white/5 hover:bg-white/5 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-1 h-full bg-red-500/50" />

                                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                            {/* Client Info */}
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                                                    <User className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-black text-lg">{inv.customerName}</h3>
                                                        <Badge variant="outline" className="font-mono text-[10px] bg-white/5 border-white/10 hover:bg-white/10">
                                                            {inv.player || 'عميل'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                                                        <button onClick={() => handleCopy(inv.number)} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                                            <FileText className="h-3.5 w-3.5" />
                                                            {inv.number}
                                                        </button>
                                                        {inv.dueDate && (
                                                            <span className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold", isOverdue ? "bg-red-500/10 text-red-500" : "bg-white/5 text-muted-foreground")}>
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                {format(new Date(inv.dueDate), 'dd MMM', { locale: ar })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Financials */}
                                            <div className="flex items-center gap-8 justify-between lg:justify-end flex-1 pl-4 lg:pl-8 py-4 lg:py-0 border-t lg:border-t-0 border-white/5">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mb-1">الإجمالي</p>
                                                    <p className="font-bold font-mono text-muted-foreground">{inv.total.toLocaleString()}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mb-1">المدفوع</p>
                                                    <p className="font-bold font-mono text-emerald-500">{inv.paidAmount.toLocaleString()}</p>
                                                </div>
                                                <div className="text-center relative">
                                                    <p className="text-[10px] font-bold text-red-500 uppercase opacity-80 mb-1">المتبقي</p>
                                                    <p className="text-2xl font-black font-mono text-red-500">{remaining.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="flex justify-end lg:w-auto">
                                                <Button
                                                    onClick={() => openPaymentDialog(inv)}
                                                    className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <Wallet className="h-5 w-5 ml-2" />
                                                    تحصيل
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Premium Payment Dialog */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="sm:max-w-[480px]  border-white/10 p-0 rounded-[2.5rem] overflow-hidden" dir="rtl">
                    <div className="bg-[#0f172a] p-6 border-b border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></span>
                                تسجيل دفعة جديدة
                            </DialogTitle>
                            <DialogDescription className="font-medium opacity-80 pt-1">
                                سداد مستحقات للفاتورة {selectedInvoice?.number}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6 bg-gradient-to-b from-[#0f172a] to-[#0f172a]/95">
                        {/* Short Info */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground mb-1">المبلغ المتبقي</p>
                                <p className="text-2xl font-black text-red-500">{(selectedInvoice?.total - selectedInvoice?.paidAmount).toLocaleString()}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPaymentAmount((selectedInvoice?.total - selectedInvoice?.paidAmount).toString())}
                                className="h-8 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10"
                            >
                                سداد كامل المبلغ
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-sm">قيمة الدفعة (ج.م)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                    <Input
                                        type="number"
                                        className="h-14 pr-12 rounded-2xl bg-white/5 border-white/5 font-mono text-xl font-bold"
                                        placeholder="0.00"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-sm">طريقة الدفع</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/5 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/10 bg-[#1e293b]">
                                        <SelectItem value="cash" className="font-bold"><span className="flex items-center gap-2"><Banknote className="h-4 w-4" /> نقداً (الخزينة)</span></SelectItem>
                                        <SelectItem value="bank" className="font-bold"><span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> تحويل بنكي</span></SelectItem>
                                        <SelectItem value="check" className="font-bold"><span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> شيك</span></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-sm">ملاحظات (اختياري)</Label>
                                <Textarea
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    placeholder="رقم الشيك، مرجع التحويل..."
                                    className="min-h-[80px] rounded-2xl bg-white/5 border-white/5 font-medium resize-none"
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                            onClick={() => paymentMutation.mutate()}
                            disabled={paymentMutation.isPending || !paymentAmount}
                        >
                            {paymentMutation.isPending ? <Loader2 className="animate-spin" /> : 'تأكيد العملية'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

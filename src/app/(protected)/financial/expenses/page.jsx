'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { todayLocal } from '@/lib/dates';
import { Loader2, Receipt, ArrowDownRight, Wallet, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/utils';

export default function ExpensesPage() {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [category, setCategory] = useState('other');
    const [date, setDate] = useState(() => todayLocal());

    const mutation = useMutation({
        mutationFn: async (payload) => {
            const res = await fetch('/api/financial/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to record expense');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('تم تسجيل المصروف بنجاح');
            setAmount('');
            setReason('');
            setCategory('other');
            queryClient.invalidateQueries(['dashboard-kpis']);
        },
        onError: (err) => toast.error(err.message),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ amount, reason, category, date });
    };

    return (
        <div className="min-h-screen bg-foreground/1020 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}

            {/* Header Section */}
            <PageHeader
                title="إدارة المصروفات"
                subtitle="تسجيل المصاريف التشغيلية والنثرية والرواتب"
                icon={Receipt}
            />

            <div className="max-w-4xl mx-auto">
                <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[2.5rem] overflow-hidden">
                    <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20 text-destructive">
                                <ArrowDownRight size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight uppercase">تسجيل مصروف جديد</h2>
                                <p className="text-sm font-bold text-white/20">سيتم خصم المبلغ من رصيد الخزينة</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <Label htmlFor="amount" className="font-bold text-white/40 uppercase tracking-widest text-xs mr-2">المبلغ (ج.م)</Label>
                                <div className="relative group">
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="h-16 pl-14 pr-6 rounded-2xl bg-white/[0.03] border-white/10 focus:bg-white/[0.05] focus:border-destructive/50 transition-all font-bold text-2xl tabular-nums shadow-inner ring-0 focus-visible:ring-0"
                                        placeholder="0.00"
                                    />
                                    <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-destructive/50 group-focus-within:text-destructive transition-colors" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="date" className="font-bold text-white/40 uppercase tracking-widest text-xs mr-2">التاريخ</Label>
                                <div className="relative">
                                    <Input
                                        id="date"
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="h-16 pl-14 pr-6 rounded-2xl bg-white/[0.03] border-white/10 focus:bg-white/[0.05] focus:border-primary/50 transition-all font-bold text-lg ring-0 focus-visible:ring-0"
                                    />
                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/50" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="category" className="font-bold text-white/40 uppercase tracking-widest text-xs mr-2">التصنيف</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="h-16 rounded-2xl bg-white/[0.03] border-white/10 focus:bg-white/[0.05] focus:border-primary/50 transition-all font-bold text-lg px-6 ring-0 focus-visible:ring-0">
                                        <SelectValue placeholder="اختر التصنيف" />
                                    </SelectTrigger>
                                    <SelectContent className="glass-card border-white/10 rounded-2xl overflow-hidden backdrop-blur-3xl">
                                        <SelectItem value="rent" className="h-12 font-bold focus:bg-primary/20">إيجار</SelectItem>
                                        <SelectItem value="salaries" className="h-12 font-bold focus:bg-primary/20">رواتب وأجور</SelectItem>
                                        <SelectItem value="utilities" className="h-12 font-bold focus:bg-primary/20">مرافق (كهرباء/مياه)</SelectItem>
                                        <SelectItem value="maintenance" className="h-12 font-bold focus:bg-primary/20">صيانة</SelectItem>
                                        <SelectItem value="marketing" className="h-12 font-bold focus:bg-primary/20">تسويق</SelectItem>
                                        <SelectItem value="supplies" className="h-12 font-bold focus:bg-primary/20">أدوات مكتبية/مخزنية</SelectItem>
                                        <SelectItem value="other" className="h-12 font-bold focus:bg-primary/20">أخرى</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="reason" className="font-bold text-white/40 uppercase tracking-widest text-xs mr-2">البيان / السبب</Label>
                                <Textarea
                                    id="reason"
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="مثلاً: سداد فاتورة الكهرباء لشهر ديسمبر"
                                    rows={3}
                                    className="rounded-2xl bg-white/[0.03] border-white/10 focus:bg-white/[0.05] focus:border-primary/50 transition-all font-bold text-lg p-6 ring-0 focus-visible:ring-0 resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-16 text-xl font-bold uppercase tracking-widest rounded-2xl bg-destructive hover:bg-destructive text-white shadow-2xl shadow-destructive/30 transition-all duration-300 disabled:opacity-50 group"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? (
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                ) : (
                                    <ArrowDownRight className="mr-3 h-6 w-6 group-hover:rotate-45 transition-transform" />
                                )}
                                حفظ المصروف
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto glass-card p-8 rounded-3xl border border-white/10 border-dashed text-center">
                    <p className="text-lg font-bold text-white/30 italic">
                        تنبيه: سيظهر هذا المصروف في إجمالي &quot;مصاريف اليوم&quot; ويؤثر على &quot;صافي الربح&quot; في لوحة التحكم.
                    </p>
                </div>
            </div>
        </div>
    );
}

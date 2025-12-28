'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Receipt, ArrowDownRight, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpensesPage() {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [category, setCategory] = useState('other');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">إدارة المصروفات</h1>
                <p className="text-muted-foreground mt-2">تسجيل المصاريف التشغيلية والنثرية (إيجار، رواتب، الخ)</p>
            </div>

            <Card className="border-none shadow-xl bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="text-primary h-6 w-6" />
                        تسجيل مصروف جديد
                    </CardTitle>
                    <CardDescription>سيتم خصم هذا المبلغ من رصيد الخزينة الحالي</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">المبلغ (ج.م)</Label>
                                <div className="relative">
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-10 text-lg font-bold"
                                        placeholder="0.00"
                                    />
                                    <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">التاريخ</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">التصنيف</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="اختر التصنيف" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rent">إيجار</SelectItem>
                                    <SelectItem value="salaries">رواتب وأجور</SelectItem>
                                    <SelectItem value="utilities">مرافق (كهرباء/مياه)</SelectItem>
                                    <SelectItem value="maintenance">صيانة</SelectItem>
                                    <SelectItem value="marketing">تسويق</SelectItem>
                                    <SelectItem value="supplies">أدوات مكتبية/مخزنية</SelectItem>
                                    <SelectItem value="other">أخرى</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">البيان / السبب</Label>
                            <Textarea
                                id="reason"
                                required
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="مثلاً: سداد فاتورة الكهرباء لشهر ديسمبر"
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-semibold gradient-primary shadow-lg hover-lift"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <ArrowDownRight className="mr-2 h-5 w-5" />
                            )}
                            حفظ المصروف
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="bg-muted/40 p-4 rounded-lg border border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground">
                    تنبيه: سيظهر هذا المصروف في إجمالي "مصاريف اليوم" ويؤثر على "صافي الربح" في لوحة التحكم.
                </p>
            </div>
        </div>
    );
}

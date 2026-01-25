'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, Loader2, DollarSign, Banknote, Building2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export function InvoicePaymentDialog({ open, onOpenChange, invoice }) {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (open && invoice) {
            setAmount((invoice.total - invoice.paidAmount).toString());
            setNote('');
            setMethod('cash');
        }
    }, [open, invoice]);

    const router = useRouter();

    const paymentMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: invoice._id,
                    amount: parseFloat(amount),
                    method,
                    note
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to record payment');
            return data;
        },
        onSuccess: (res) => {
            toast.success('تم تسجيل الدفعة بنجاح');
            onOpenChange(false);
            queryClient.invalidateQueries(['receivables']);
            queryClient.invalidateQueries(['customers']);

            if (res.data?.transaction?._id) {
                router.push(`/financial/receipts/${res.data.transaction._id}`);
            }
        },
        onError: (err) => toast.error(err.message),
    });

    if (!invoice) return null;

    const remaining = invoice.total - invoice.paidAmount;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] border-white/10 p-0 rounded-[2.5rem] overflow-hidden" dir="rtl">
                <div className="bg-[#0f172a] p-6 border-b border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></span>
                            تسجيل دفعة جديدة
                        </DialogTitle>
                        <DialogDescription className="font-medium opacity-80 pt-1">
                            سداد مستحقات للفاتورة {invoice.number}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6 bg-gradient-to-b from-[#0f172a] to-[#0f172a]/95">
                    {/* Short Info */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-muted-foreground mb-1">المبلغ المتبقي</p>
                            <p className="text-2xl font-black text-red-500">{remaining.toLocaleString()}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAmount(remaining.toString())}
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
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-sm">طريقة الدفع</Label>
                            <Select value={method} onValueChange={setMethod}>
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
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="رقم الشيك، مرجع التحويل..."
                                className="min-h-[80px] rounded-2xl bg-white/5 border-white/5 font-medium resize-none"
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        onClick={() => paymentMutation.mutate()}
                        disabled={paymentMutation.isPending || !amount || parseFloat(amount) <= 0}
                    >
                        {paymentMutation.isPending ? <Loader2 className="animate-spin" /> : 'تأكيد عملية التحصيل'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

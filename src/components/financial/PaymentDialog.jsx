'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAddPayment, useDebtInstallments } from '@/hooks/useFinancial';
import { formatCurrency } from '@/utils';
import { Loader2, Coins, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PaymentDialog({ open, onOpenChange, debt, targetInstallmentId }) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [notes, setNotes] = useState('');

    const { mutate: addPayment, isPending } = useAddPayment();
    const { data: installments, isLoading: isLoadingInstallments } = useDebtInstallments(debt?._id);

    // Auto-suggest installment amount
    useEffect(() => {
        if (!open || !debt) return;

        if (debt.meta?.isScheduled) {
            if (installments && installments.length > 0) {
                let target;
                if (targetInstallmentId) {
                    target = installments.find(i => i._id === targetInstallmentId);
                }

                if (!target) {
                    target = installments.find(i => i.status === 'PENDING');
                }

                if (target) {
                    setAmount(target.amount.toString());
                    setNotes(`سداد القسط المستحق بتاريخ ${new Date(target.dueDate).toLocaleDateString('ar-EG')}`);
                } else {
                    setAmount(debt.remainingAmount.toString());
                }
            } else if (!isLoadingInstallments) {
                setAmount(debt.remainingAmount.toString());
            }
        } else {
            setAmount(debt.remainingAmount.toString());
        }
    }, [open, debt?._id, installments, isLoadingInstallments, targetInstallmentId]);

    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!debt) return;

        addPayment({
            debtId: debt._id,
            amount: parseFloat(amount),
            method,
            notes
        }, {
            onSuccess: (res) => {
                onOpenChange(false);
                setAmount('');
                setNotes('');
                if (res.data?.transaction?._id) {
                    router.push(`/financial/receipts/${res.data.transaction._id}`);
                }
            }
        });
    };

    if (!debt) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card/95 border-white/10 backdrop-blur-2xl rounded-[1.5rem]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black flex items-center gap-2">
                        <Coins className="text-primary" /> تسجيل دفعة جديدة
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-1 shadow-sm">
                        {debt.meta?.isScheduled && (isLoadingInstallments || (installments && installments.find(i => i.status === 'PENDING'))) ? (
                            isLoadingInstallments ? (
                                <div className="h-16 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
                                </div>
                            ) : (
                                <>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-primary opacity-60 block">قيمة القسط المستحق</span>
                                    <div className="text-3xl font-black tracking-tighter text-foreground flex items-baseline gap-1">
                                        {formatCurrency(installments.find(i => i.status === 'PENDING')?.amount || 0)}
                                        <span className="text-xs text-muted-foreground font-bold italic">د.ل</span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground font-bold mt-2 pt-2 border-t border-primary/10 flex justify-between items-center">
                                        <span>{debt.debtorId?.name} • {debt.referenceType === 'Invoice' ? 'فاتورة' : 'أمر شراء'}</span>
                                        <span className="text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded-full border border-rose-500/10 font-black">إجمالي المتبقي: {formatCurrency(debt.remainingAmount)}</span>
                                    </div>
                                </>
                            )
                        ) : (
                            <>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-primary opacity-60 block">المبلغ المتبقي حالياً</span>
                                        <div className="text-3xl font-black tracking-tighter text-foreground flex items-baseline gap-1">
                                            {formatCurrency(debt.remainingAmount)}
                                            <span className="text-xs text-muted-foreground font-bold italic">د.ل</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[11px] text-muted-foreground font-bold mt-2 pt-2 border-t border-primary/10">
                                    {debt.debtorId?.name} • {debt.referenceType === 'Invoice' ? 'فاتورة' : 'أمر شراء'}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center mr-1">
                            <Label className="text-xs font-bold">قيمة الدفعة *</Label>
                            {debt.meta?.isScheduled && (
                                <span className="text-[10px] font-black text-primary flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">
                                    <Sparkles size={10} /> اقتراح القسط القادم
                                </span>
                            )}
                        </div>
                        <Input
                            type="number"
                            step="0.01"
                            max={debt.remainingAmount}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-12 rounded-xl bg-muted/30 border-white/10 font-mono font-bold text-lg"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold mr-1">طريقة السداد</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-white/10 font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">نقدي (Cash)</SelectItem>
                                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                                <SelectItem value="check">شيك</SelectItem>
                                <SelectItem value="cash_wallet">محفظة كاش</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold mr-1">ملاحظات إضافية</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="رقم العملية، رقم الشيك، أو أي تفاصيل أخرى..."
                            className="bg-muted/30 border-white/10 rounded-xl resize-none h-24 font-bold"
                        />
                    </div>

                    <DialogFooter className="gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-6 h-12 font-bold">
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || !amount}
                            className="h-12 rounded-xl px-8 font-black gradient-primary shadow-colored border-0 hover:scale-105 transition-all"
                        >
                            {isPending && <Loader2 className="animate-spin w-4 h-4 ml-2" />}
                            تأكيد وتسجيل العملية
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

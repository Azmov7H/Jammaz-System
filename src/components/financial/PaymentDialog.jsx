'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function PaymentDialog({ open, onOpenChange, debt }) {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [notes, setNotes] = useState('');

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await fetch('/api/financial/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to record payment');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('تم تسجيل الدفعة بنجاح');
            queryClient.invalidateQueries(['debts']);
            onOpenChange(false);
            setAmount('');
            setNotes('');
        },
        onError: (err) => toast.error(err.message)
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!debt) return;

        mutation.mutate({
            debtId: debt._id,
            amount: parseFloat(amount),
            method,
            notes
        });
    };

    if (!debt) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card border-white/10">
                <DialogHeader>
                    <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                        <span className="text-xs text-muted-foreground block">المبلغ المستحق</span>
                        <div className="text-2xl font-black tracking-tight">{formatCurrency(debt.remainingAmount)}</div>
                        <div className="text-xs text-muted-foreground opacity-70">
                            {debt.debtorId?.name} | {debt.referenceType === 'Invoice' ? 'فاتورة' : 'أمر شراء'}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>قيمة الدفعة</Label>
                        <Input
                            type="number"
                            step="0.01"
                            max={debt.remainingAmount}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-white/5 font-mono font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>طريقة الدفع</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="bg-white/5">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">نقدي (Cash)</SelectItem>
                                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                                <SelectItem value="check">شيك</SelectItem>
                                <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>ملاحظات (اختياري)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="رقم العملية، رقم الشيك، ملاحظات..."
                            className="bg-white/5 resize-none h-20"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={mutation.isPending || !amount} className="bg-primary text-white">
                            {mutation.isPending ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : null}
                            تأكيد الدفع
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

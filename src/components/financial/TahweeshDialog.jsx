'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PiggyBank, ArrowDownToLine, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentMethodSelect } from '@/components/common/PaymentMethodSelect';
import { SourceNumberField } from '@/components/financial/SourceNumberField';
import { isSourceNumberRequired } from '@/lib/paymentMethods';
import { useTahweeshBalance, useTahweeshDeposit, useTahweeshWithdraw } from '@/hooks/useFinancial';
import { cn } from '@/utils';

// FIN-TAHWEESH-05 (T-14): set-aside transfer dialog. The set-aside stays
// visually separated from operating money; the backend rejects over-amounts
// and this dialog refuses to submit them (toast, never silent clamping).
const DEPOSIT_SOURCES = ['cash', 'instapay', 'wallet'];
const SOURCE_LABELS = { cash: 'الخزينة النقدية', instapay: 'انستا باي', wallet: 'محفظة الكاش' };

function newTransferId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `t-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export function TahweeshDialog({ breakdown = {} }) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('deposit'); // 'deposit' | 'withdraw'
    const [source, setSource] = useState('cash');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [sourceNumber, setSourceNumber] = useState('');

    const { data: balanceData } = useTahweeshBalance({ enabled: open });
    const tahweeshBalance = Number(balanceData?.balance ?? 0);
    const depositMutation = useTahweeshDeposit();
    const withdrawMutation = useTahweeshWithdraw();
    const isPending = depositMutation.isPending || withdrawMutation.isPending;

    const available = mode === 'deposit'
        ? Number(Number(breakdown[source]) || 0)
        : tahweeshBalance;
    const availableLabel = mode === 'deposit' ? SOURCE_LABELS[source] : 'رصيد التحويش';

    const reset = () => {
        setAmount('');
        setNote('');
        setSourceNumber('');
        setSource('cash');
        setMode('deposit');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const value = parseFloat(amount);
        if (!Number.isFinite(value) || value <= 0) {
            toast.error('أدخل مبلغًا أكبر من صفر');
            return;
        }
        if (Number((value - available).toFixed(2)) > 0) {
            toast.error(`المبلغ يتجاوز المتاح في ${availableLabel} (${available.toLocaleString()})`);
            return;
        }
        if (mode === 'deposit' && isSourceNumberRequired(source) && !sourceNumber.trim()) {
            toast.error('رقم حساب التحويل مطلوب');
            return;
        }
        const transferId = newTransferId();
        const done = () => {
            setOpen(false);
            reset();
        };
        if (mode === 'deposit') {
            depositMutation.mutate(
                { source, amount: value, note, transferId, sourceNumber: sourceNumber || undefined },
                { onSuccess: done }
            );
        } else {
            withdrawMutation.mutate(
                { amount: value, note, transferId },
                { onSuccess: done }
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-teal-500/30 text-teal-600 hover:bg-teal-500/10">
                    <PiggyBank size={18} />
                    <span>تحويش</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <PiggyBank className="text-teal-600" /> التحويش (مبلغ مرصود)
                    </DialogTitle>
                    <DialogDescription>
                        نقل الأموال إلى حساب مرصود منفصل عن مصاريف التشغيل — لا يؤثر على صافي الربح
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/60">
                    {[
                        { id: 'deposit', label: 'إيداع في التحويش', icon: ArrowDownToLine },
                        { id: 'withdraw', label: 'سحب إلى الخزينة', icon: ArrowUpFromLine },
                    ].map((t) => (
                        <Button
                            key={t.id}
                            type="button"
                            variant={mode === t.id ? 'default' : 'ghost'}
                            onClick={() => setMode(t.id)}
                            className="gap-2"
                        >
                            <t.icon size={16} />
                            {t.label}
                        </Button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 space-y-1">
                        <span className="text-xs uppercase font-semibold tracking-wide text-teal-600 opacity-80 block">
                            {mode === 'deposit' ? `المتاح في ${availableLabel}` : 'رصيد التحويش الحالي'}
                        </span>
                        <div className="text-3xl font-bold tracking-tight tabular-nums">
                            {available.toLocaleString()} <span className="text-sm font-medium">ج.م</span>
                        </div>
                    </div>

                    {mode === 'deposit' && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">من حساب</Label>
                            <PaymentMethodSelect
                                value={source}
                                onValueChange={setSource}
                                methods={DEPOSIT_SOURCES}
                                className="h-11"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="tahweesh-amount" className="text-sm font-medium">المبلغ *</Label>
                        <Input
                            id="tahweesh-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            max={available}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            className="h-11 tabular-nums"
                            dir="ltr"
                        />
                    </div>

                    {mode === 'deposit' && (
                        <SourceNumberField
                            method={source}
                            value={sourceNumber}
                            onChange={setSourceNumber}
                        />
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="tahweesh-note" className="text-sm font-medium">ملاحظة</Label>
                        <Input
                            id="tahweesh-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="مثال: تحويش لشراء بضاعة"
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || !amount || parseFloat(amount) <= 0}
                            className={cn(mode === 'deposit' && 'bg-teal-600 hover:bg-teal-700')}
                        >
                            {isPending && <Loader2 className="animate-spin w-4 h-4 ml-2" />}
                            {mode === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

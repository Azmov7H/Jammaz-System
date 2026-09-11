'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddPayment, useCustomerTotalPayment, useDebtInstallments } from '@/hooks/useFinancial';
import { formatCurrency } from '@/utils';
import { Loader2, Coins, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isSourceNumberRequired } from '@/lib/paymentMethods';
import { api } from '@/lib/api-utils';
import { SourceNumberField } from '@/components/financial/SourceNumberField';
import { PaymentMethodSelect } from '@/components/common/PaymentMethodSelect';

/**
 * Single payment-collection dialog (UX-080).
 * Replaces PaymentDialog / InvoicePaymentDialog / UnifiedPaymentDialog(v1).
 *
 * `target` (one of):
 *   { kind: 'debt', debt, targetInstallmentId }
 *   { kind: 'customer-total', customerId, customerName, totalBalance }
 *   { kind: 'invoice', invoice }
 *
 * Payloads and endpoints are preserved byte-for-byte from the legacy variants
 * (see docs/ux-ui-improvement/payment-parity-matrix.md) — do not change keys
 * (`notes` vs `note`) or endpoints without a business decision.
 *
 * Business decision (audit fix): the invoice target previously posted to
 * POST /api/payments, which does not exist — it now uses the canonical
 * POST /api/financial/payments/customer ({invoice,…}) via the api client
 * (which unwraps the {success,data} envelope).
 */
export function UnifiedPaymentDialog({ open, onOpenChange, target, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [note, setNote] = useState('');
    const [sourceNumber, setSourceNumber] = useState('');

    const kind = target?.kind;

    // --- debt target ---
    const debt = kind === 'debt' ? target.debt : null;
    const targetInstallmentId = target?.targetInstallmentId;
    const { data: installments, isLoading: isLoadingInstallments } = useDebtInstallments(debt?._id);
    const { mutate: addDebtPayment, isPending: isDebtPending } = useAddPayment();

    // --- customer-total target ---
    const { mutate: addTotalPayment, isPending: isTotalPending } = useCustomerTotalPayment();

    // --- invoice target ---
    const queryClient = useQueryClient();
    const invoicePaymentMutation = useMutation({
        mutationFn: () => api.post('/api/financial/payments/customer', {
            invoice: target.invoice._id,
            amount: parseFloat(amount),
            method,
            note,
            sourceNumber: sourceNumber || undefined
        }),
        onSuccess: (res) => {
            toast.success('تم تسجيل الدفعة بنجاح');
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ['receivables'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['treasury'] });
            queryClient.invalidateQueries({ queryKey: ['treasury-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['treasury-cashflow'] });
            onSuccess?.();

            if (res?.transaction?._id) {
                router.push(`/financial/receipts/${res.transaction._id}`);
            }
        },
        onError: (err) => toast.error(err.message),
    });
    const invoice = kind === 'invoice' ? target.invoice : null;

    const router = useRouter();
    const isPending = isDebtPending || isTotalPending || invoicePaymentMutation.isPending;

    // Prefill rules preserved per legacy variant
    useEffect(() => {
        if (!open || !kind) return;

        if (kind === 'debt' && debt) {
            if (debt.meta?.isScheduled) {
                if (installments && installments.length > 0) {
                    let inst;
                    if (targetInstallmentId) {
                        inst = installments.find(i => i._id === targetInstallmentId);
                    }
                    if (!inst) {
                        inst = installments.find(i => i.status === 'PENDING');
                    }
                    if (inst) {
                        setAmount(inst.amount.toString());
                        setNote(`سداد القسط المستحق بتاريخ ${new Date(inst.dueDate).toLocaleDateString('ar-EG')}`);
                    } else {
                        setAmount(debt.remainingAmount.toString());
                    }
                } else if (!isLoadingInstallments) {
                    setAmount(debt.remainingAmount.toString());
                }
            } else {
                setAmount(debt.remainingAmount.toString());
            }
            setMethod('cash');
        }

        if (kind === 'customer-total') {
            setAmount(target.totalBalance?.toString() || '');
            setNote(`تحصيل دفعة من الرصيد الإجمالي للعميل: ${target.customerName}`);
            setMethod('cash');
        }

        if (kind === 'invoice' && invoice) {
            setAmount((invoice.total - invoice.paidAmount).toString());
            setNote('');
            setMethod('cash');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, kind, debt?._id, installments, isLoadingInstallments, targetInstallmentId, target?.totalBalance, invoice?._id]);

    if (!kind) return null;

    // FIN-OVERDEDUCT: UX ceiling per target (early feedback only — the
    // backend rejects overpay; the amount is never silently modified).
    const maxAmount = kind === 'invoice' && invoice
        ? Number((invoice.total - invoice.paidAmount).toFixed(2))
        : kind === 'debt' && debt
            ? Number(Number(debt.remainingAmount || 0).toFixed(2))
            : kind === 'customer-total'
                ? Number(Number(target.totalBalance || 0).toFixed(2))
                : null;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isSourceNumberRequired(method) && !sourceNumber.trim()) {
            toast.error('رقم حساب التحويل مطلوب');
            return;
        }

        if (maxAmount !== null && Number((parseFloat(amount) - maxAmount).toFixed(2)) > 0) {
            toast.error(`المبلغ يتجاوز المتاح (${maxAmount.toLocaleString()})`);
            return;
        }

        if (kind === 'debt' && debt) {
            addDebtPayment({
                debtId: debt._id,
                amount: parseFloat(amount),
                method,
                notes: note,
                sourceNumber
            }, {
                onSuccess: (res) => {
                    onOpenChange(false);
                    setAmount('');
                    setNote('');
                    setSourceNumber('');
                    onSuccess?.();
                    if (res.data?.transaction?._id) {
                        router.push(`/financial/receipts/${res.data.transaction._id}`);
                    }
                }
            });
            return;
        }

        if (kind === 'customer-total') {
            addTotalPayment({
                customerId: target.customerId,
                data: {
                    amount: parseFloat(amount),
                    method,
                    note,
                    sourceNumber
                }
            }, {
                onSuccess: (res) => {
                    onOpenChange(false);
                    onSuccess?.();
                    if (res.data?.transaction?._id) {
                        router.push(`/financial/receipts/${res.data.transaction._id}`);
                    }
                }
            });
            return;
        }

        if (kind === 'invoice') {
            invoicePaymentMutation.mutate();
        }
    };

    // ---- Summary block per kind (copy preserved from legacy variants) ----
    let summary;
    let methodOptions = ['cash', 'bank', 'check', 'instapay'];

    if (kind === 'debt' && debt) {
        methodOptions.push('wallet');
        const pendingInst = installments?.find(i => i.status === 'PENDING');
        summary = debt.meta?.isScheduled && (isLoadingInstallments || pendingInst) ? (
            isLoadingInstallments ? (
                <div className="h-16 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
                </div>
            ) : (
                <>
                    <span className="text-xs uppercase font-semibold tracking-wide text-primary opacity-70 block">قيمة القسط المستحق</span>
                    <div className="text-3xl font-bold tracking-tight text-foreground flex items-baseline gap-1">
                        {formatCurrency(pendingInst?.amount || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium mt-2 pt-2 border-t border-primary/10 flex justify-between items-center">
                        <span>{debt.debtorId?.name} • {debt.referenceType === 'Invoice' ? 'فاتورة' : 'أمر شراء'}</span>
                        <span className="text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20 font-medium">إجمالي المتبقي: {formatCurrency(debt.remainingAmount)}</span>
                    </div>
                </>
            )
        ) : (
            <>
                <span className="text-xs uppercase font-semibold tracking-wide text-primary opacity-70 block">المبلغ المتبقي حالياً</span>
                <div className="text-3xl font-bold tracking-tight text-foreground flex items-baseline gap-1">
                    {formatCurrency(debt.remainingAmount)}
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-2 pt-2 border-t border-primary/10">
                    {debt.debtorId?.name} • {debt.referenceType === 'Invoice' ? 'فاتورة' : 'أمر شراء'}
                </div>
            </>
        );
    } else if (kind === 'customer-total') {
        methodOptions.push('wallet');
        summary = (
            <>
                <span className="text-xs uppercase font-semibold tracking-wide text-primary opacity-70 block">الرصيد الإجمالي</span>
                <div className="text-3xl font-bold tracking-tight text-foreground">{formatCurrency(target.totalBalance || 0)}</div>
                <div className="text-xs text-muted-foreground font-medium mt-2 pt-2 border-t border-primary/10">العميل: {target.customerName}</div>
            </>
        );
    } else if (kind === 'invoice' && invoice) {
        const remaining = invoice.total - invoice.paidAmount;
        summary = (
            <>
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-xs uppercase font-semibold tracking-wide text-primary opacity-70 block">المبلغ المتبقي</span>
                        <div className="text-2xl font-bold text-destructive">{remaining.toLocaleString()}</div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setAmount(remaining.toString())} className="h-8 text-xs">
                        سداد كامل المبلغ
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-2 pt-2 border-t border-primary/10">فاتورة رقم {invoice.number}</div>
            </>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <Coins className="text-primary" /> تسجيل دفعة جديدة
                    </DialogTitle>
                    <DialogDescription>
                        {kind === 'invoice' ? 'سداد مستحقات للفاتورة' : kind === 'customer-total' ? 'سيتم توزيع الدفعة على فواتير العميل' : 'تسجيل دفعة على الحساب'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
                        {summary}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment-amount" className="text-sm font-medium">قيمة الدفعة *</Label>
                        <Input
                            id="payment-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            max={maxAmount ?? undefined}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            className="h-11 tabular-nums"
                            dir="ltr"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">طريقة السداد</Label>
                        <PaymentMethodSelect
                            value={method}
                            onValueChange={setMethod}
                            methods={methodOptions}
                            className="h-11"
                        />
                    </div>

                    <SourceNumberField
                        id="payment-source"
                        method={method}
                        value={sourceNumber}
                        onChange={setSourceNumber}
                        autoFocus
                    />

                    <div className="space-y-2">
                        <Label htmlFor="payment-note" className="text-sm font-medium">ملاحظات إضافية</Label>
                        <Textarea
                            id="payment-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="رقم العملية، رقم الشيك، أو أي تفاصيل أخرى..."
                            className="resize-none h-20"
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || !amount || parseFloat(amount) <= 0}
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

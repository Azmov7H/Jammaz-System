'use client';

/**
 * FIN-REV-01 (T-REV) — compact compensating-reversal affordance.
 * Self-contained: renders a reverse icon (owner-only & eligible) or a muted
 * disabled icon with a guidance tooltip for known-irreversible/source-doc
 * cases, and opens its own confirmation dialog with an optional reason.
 *
 * `tx` is either a ledger row or a document-statement line carrying the
 * reversal fields (`txId`, `referenceType`, `isReversed`, `isReversal`,
 * `isPaymentLeg`).
 */

import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useReverseTransaction } from '@/hooks/useFinancial';
import { useUserRole } from '@/hooks/useUserRole';
import { ROLES } from '@/lib/permissions';
import { getReversalAction } from '@/lib/transactionReversal';

function toLedgerRow(tx) {
    if (!tx) return tx;
    const metaPresent = tx.isPaymentLeg === true ? { marker: 1 } : (tx.meta || undefined);
    return {
        referenceType: tx.referenceType,
        isReversed: tx.isReversed,
        meta: metaPresent,
    };
}

export function ReversalActionButton({ tx, size = 16, disabled }) {
    const { role } = useUserRole();
    const { mutate: reverseTransaction, isPending } = useReverseTransaction();
    const [open, setOpen] = React.useState(false);
    const [reason, setReason] = React.useState('');

    const rev = getReversalAction(toLedgerRow(tx), role);
    if (!rev.canReverse) {
        if (role === ROLES.OWNER && rev.guidance) {
            // Known non-reversible row — surface why (source-doc cancel etc.).
            return (
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="غير قابلة للعكس"
                    title={rev.guidance}
                    className="text-muted-foreground/40 cursor-not-allowed h-8 w-8"
                >
                    <RotateCcw size={size} />
                </Button>
            );
        }
        return null;
    }

    const id = tx?.txId || tx?._id;
    if (!id) return null;

    const confirm = () => {
        reverseTransaction({ id, reason });
        setOpen(false);
        setReason('');
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                aria-label="عكس المعاملة"
                title="عكس المعاملة (تعويضي — يحافظ على التاريخ)"
                className="text-muted-foreground hover:text-warning h-8 w-8"
                onClick={() => setOpen(true)}
                disabled={disabled || isPending}
            >
                <RotateCcw size={size} />
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="عكس المعاملة"
                description="سيتم تسجيل حركة معاكسة (تعويضية) وإلغاء الأثر المالي مع الاحتفاظ بسجل العملية بالتزامن مع إلغاء الأثر على المديونيات/أوامر الشراء."
                confirmLabel={isPending ? 'جارٍ العكس…' : 'عكس المعاملة'}
                pending={isPending}
                onConfirm={confirm}
            >
                <div className="space-y-1.5">
                    <Label htmlFor={`reverse-reason-${id}`}>سبب العكس (اختياري)</Label>
                    <Textarea
                        id={`reverse-reason-${id}`}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="مثال: إدخال مكرر بالخطأ"
                        rows={2}
                        disabled={isPending}
                    />
                </div>
            </ConfirmDialog>
        </>
    );
}
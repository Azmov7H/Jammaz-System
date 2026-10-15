'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Loader2, ArrowLeftRight, ShoppingCart, Lock } from 'lucide-react';
import { useWarehouseDeletionPreflight } from '@/hooks/useWarehouses';

/**
 * Deletion dialog driven entirely by the backend pre-flight:
 *  - primary warehouse → blocked (informational only)
 *  - warehouse with stock → requires a destination + explicit confirmation
 *  - open purchase orders → blocked
 * The user can never delete a warehouse without seeing its stock/consequences.
 */
export function WarehouseDeleteDialog({ open, onOpenChange, warehouse, onConfirm, isPending }) {
    const [destinationId, setDestinationId] = useState('');
    const [confirmed, setConfirmed] = useState(false);

    const { data: preflight, isLoading } = useWarehouseDeletionPreflight(
        open ? warehouse?._id : null
    );

    useEffect(() => {
        if (open) {
            setDestinationId('');
            setConfirmed(false);
        }
    }, [open, warehouse?._id]);

    const totalUnits = preflight?.totalUnits ?? 0;
    const requiresDestination = !!preflight?.requiresDestination;
    const blockedByPO = !!preflight?.blockedByPurchaseOrders;
    const isPrimary = !!preflight?.isPrimary || !!warehouse?.isPrimary;
    const destinations = preflight?.availableDestinations || [];

    const canSubmit = !isPrimary
        && !blockedByPO
        && preflight?.canDelete
        && (!requiresDestination || (destinationId && confirmed));

    const handleConfirm = () => {
        onConfirm({
            destinationWarehouseId: destinationId || undefined,
            confirmed: requiresDestination ? true : undefined
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] border-white/5 bg-card/95 backdrop-blur-3xl shadow-2xl rounded-[1.5rem]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-destructive">
                        <AlertTriangle className="w-6 h-6" />
                        حذف المخزن: {warehouse?.name}
                    </DialogTitle>
                    <DialogDescription>
                        هذا الإجراء نهائي ولا يمكن التراجع عنه.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : isPrimary ? (
                        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
                            <Lock className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                            <p className="text-sm font-bold text-destructive">
                                المخزن الرئيسي نظامي ولا يمكن حذفه. يمكنك تعديل بياناته فقط.
                            </p>
                        </div>
                    ) : blockedByPO ? (
                        <div className="flex items-start gap-3 bg-warning/10 border border-warning/20 rounded-2xl p-4">
                            <ShoppingCart className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                            <p className="text-sm font-bold text-warning">
                                لا يمكن حذف المخزن لوجود {preflight?.openPurchaseOrders} أمر شراء مفتوح مرتبط به.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted/30 rounded-2xl p-4 text-center border border-white/5">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">وحدات مخزنة</p>
                                    <p className="text-2xl font-bold tabular-nums">{totalUnits.toLocaleString()}</p>
                                </div>
                                <div className="bg-muted/30 rounded-2xl p-4 text-center border border-white/5">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">منتجات متأثرة</p>
                                    <p className="text-2xl font-bold tabular-nums">{(preflight?.affectedProducts ?? 0).toLocaleString()}</p>
                                </div>
                            </div>

                            {requiresDestination && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold mr-1 flex items-center gap-2">
                                        <ArrowLeftRight size={12} /> مخزن المقصد (نقل المخزون إليه) *
                                    </Label>
                                    <Select value={destinationId} onValueChange={setDestinationId}>
                                        <SelectTrigger data-testid="warehouse-destination-select" className="h-12 rounded-xl bg-muted/30 border-white/10">
                                            <SelectValue placeholder="اختر مخزن المقصد..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {destinations.map((d) => (
                                                <SelectItem key={d._id} value={d._id}>
                                                    {d.name}{d.isPrimary ? ' (رئيسي)' : ''} — {d.code}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {requiresDestination ? (
                                <label className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-2xl p-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        data-testid="warehouse-delete-confirm-checkbox"
                                        className="mt-1 h-4 w-4 accent-destructive"
                                        checked={confirmed}
                                        onChange={(e) => setConfirmed(e.target.checked)}
                                    />
                                    <span className="text-sm font-bold">
                                        أؤكد نقل {totalUnits.toLocaleString()} وحدة إلى المخزن المحدد ثم حذف المخزن.
                                    </span>
                                </label>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    المخزن فارغ ولا يحتوي على أي مخزون. يمكن حذفه مباشرة.
                                </p>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="gap-3 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl px-6"
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        data-testid="warehouse-delete-submit"
                        disabled={!canSubmit || isPending}
                        onClick={handleConfirm}
                        className="rounded-xl px-8 font-bold"
                    >
                        {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        حذف المخزن
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

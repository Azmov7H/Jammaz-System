'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MovementTypeBadge } from '@/components/stock/MovementCard';
import { useWarehouses, usePrimaryWarehouse } from '@/hooks/useWarehouses';
import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission } from '@/lib/permissions';
import { useReverseStockMovement } from '@/hooks/useStock';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/utils';
import {
    Package,
    Warehouse,
    ArrowLeftRight,
    User,
    CalendarClock,
    Hash,
    AlertCircle,
    Layers,
    Undo2,
    Loader2
} from 'lucide-react';

/**
 * Movement types the backend can undo (transfers only — see
 * StockService.reverseMovement). Kept in sync with the server-side list.
 */
const REVERSIBLE_TYPES = ['TRANSFER', 'TRANSFER_TO_SHOP', 'TRANSFER_TO_WAREHOUSE'];

/**
 * Full-detail view for a single stock movement. Warehouse references may arrive
 * already populated (object with name/code) from the API, or as raw ids — both
 * are resolved here, falling back to the primary warehouse's name for a blank
 * (primary) side.
 */
const InfoRow = ({ icon: Icon, label, children, testid }) => (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Icon size={18} />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
            <span className="font-bold text-foreground" data-testid={testid}>{children}</span>
        </div>
    </div>
);

/**
 * Undo action for one movement. Owns its form state; Radix unmounts the
 * dialog content on close, so the state dies with the dialog (no reset
 * effect needed).
 */
function UndoActionSection({ movement, onDone }) {
    const [showForm, setShowForm] = useState(false);
    const [note, setNote] = useState('');
    const { mutate: reverseMovement, isPending: isReversing } = useReverseStockMovement();
    const m = movement;

    const handleConfirm = () => {
        reverseMovement(
            { movementId: m._id, note: note.trim() || undefined },
            {
                onSuccess: () => {
                    setShowForm(false);
                    setNote('');
                    onDone?.();
                }
            }
        );
    };

    if (!showForm) {
        return (
            <Button
                type="button"
                variant="outline"
                data-testid="movement-details-undo"
                onClick={() => setShowForm(true)}
                className="h-12 px-8 rounded-2xl font-bold border-warning/40 text-warning hover:bg-warning/10 hover:text-warning w-full sm:w-auto"
            >
                <Undo2 size={18} />
                تراجع عن هذه الحركة
            </Button>
        );
    }

    return (
        <div
            className="w-full flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-4 rounded-2xl bg-warning/5 border border-warning/20"
            data-testid="movement-details-undo-form"
        >
            <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-bold text-warning uppercase tracking-widest">
                    ملاحظة التراجع (اختياري)
                </Label>
                <Input
                    data-testid="movement-details-undo-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="سبب التراجع..."
                    className="h-11 rounded-xl font-bold"
                />
                <p className="text-xs text-muted-foreground font-bold">
                    سيتم إرجاع الكمية ({m.qty}) إلى موقعها السابق وتسجيل حركة تراجع مسجلة.
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    className="h-11 px-6 rounded-xl font-bold"
                >
                    إلغاء
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    data-testid="movement-details-undo-confirm"
                    onClick={handleConfirm}
                    disabled={isReversing}
                    className="h-11 px-6 rounded-xl font-bold"
                >
                    {isReversing ? <Loader2 className="animate-spin size-4" /> : <Undo2 size={16} />}
                    تأكيد التراجع
                </Button>
            </div>
        </div>
    );
}

export function MovementDetailsDialog({ open, onOpenChange, movement }) {
    const { data: warehousesData } = useWarehouses();
    const { data: primaryWarehouse } = usePrimaryWarehouse();
    const { role } = useUserRole();
    const m = movement;

    if (!m) return null;

    const canUndo = REVERSIBLE_TYPES.includes(m.type) && !m.reversed && !m.reverses && hasPermission(role, 'stock:manage');

    const resolveWarehouse = (value) => {
        if (value && typeof value === 'object') return value.name || 'مخزن';
        if (!value) return primaryWarehouse?.name || 'المخزن الرئيسي';
        return (warehousesData?.warehouses || []).find((w) => w._id === value)?.name || 'مخزن';
    };

    const isTransfer = m.type === 'TRANSFER' || !!m.fromWarehouseId || !!m.toWarehouseId;
    const hasSnapshot = m.snapshot && (m.snapshot.warehouseQty !== undefined || m.snapshot.shopQty !== undefined);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                dir="rtl"
                data-testid="movement-details-dialog"
                className="sm:max-w-[620px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden"
            >
                <DialogHeader className="px-6 py-4 border-b border-white/10 shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                        <div className="p-2.5 bg-primary/20 rounded-2xl">
                            <ArrowLeftRight className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span>تفاصيل الحركة</span>
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Movement Details</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Product + type + qty header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[1.5rem] bg-white/[0.04] border border-white/10">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                                <Package size={24} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-lg truncate">{m.productId?.name || 'منتج غير موجود'}</span>
                                <Badge variant="outline" className="font-mono text-xs tracking-wider border-white/10 bg-white/5 w-fit mt-1">
                                    {m.productId?.code || '—'}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <MovementTypeBadge type={m.type} />
                            {m.reversed && (
                                <Badge className="bg-warning/15 text-warning border-warning/30 w-fit">
                                    <Undo2 size={12} />
                                    تم التراجع عن هذه الحركة
                                </Badge>
                            )}
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-muted-foreground uppercase">الكمية</span>
                                <span className="text-3xl font-bold tabular-nums" data-testid="movement-details-qty">{m.qty}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {isTransfer ? (
                            <>
                                <InfoRow icon={Warehouse} label="من المخزن (المصدر)" testid="movement-details-from">
                                    {resolveWarehouse(m.fromWarehouseId)}
                                </InfoRow>
                                <InfoRow icon={Warehouse} label="إلى المخزن (الوجهة)" testid="movement-details-to">
                                    {resolveWarehouse(m.toWarehouseId)}
                                </InfoRow>
                            </>
                        ) : (
                            m.warehouseId !== undefined || m.type?.includes('WAREHOUSE') ? (
                                <InfoRow icon={Warehouse} label="المخزن" testid="movement-details-warehouse">
                                    {resolveWarehouse(m.warehouseId)}
                                </InfoRow>
                            ) : null
                        )}

                        <InfoRow icon={CalendarClock} label="التاريخ والوقت">
                            {format(new Date(m.date), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                        </InfoRow>

                        <InfoRow icon={User} label="بواسطة">
                            {m.createdBy?.name || 'غير معروف'}
                        </InfoRow>
                    </div>

                    {hasSnapshot && (
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                                <Layers size={18} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">الرصيد بعد الحركة</span>
                                <div className="flex gap-3">
                                    <span className="text-sm font-bold bg-white/5 border border-white/5 px-3 py-1 rounded-xl">
                                        المخزن: {m.snapshot.warehouseQty}
                                    </span>
                                    <span className="text-sm font-bold bg-white/5 border border-white/5 px-3 py-1 rounded-xl">
                                        المحل: {m.snapshot.shopQty}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {m.note && (
                        <InfoRow icon={AlertCircle} label="ملاحظات">
                            {m.note}
                        </InfoRow>
                    )}

                    {m.refId && (
                        <InfoRow icon={Hash} label="المرجع">
                            {String(m.refId)}
                        </InfoRow>
                    )}

                    {m._id && (
                        <div className={cn('flex items-center justify-between text-xs font-mono text-muted-foreground/60 px-2')}>
                            <span>معرّف الحركة</span>
                            <span className="truncate max-w-[60%]" dir="ltr">{m._id}</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-white/10 flex-col gap-3">
                    {canUndo && (
                        <UndoActionSection
                            key={m._id}
                            movement={m}
                            onDone={() => onOpenChange(false)}
                        />
                    )}

                    <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="gradient-primary border-0 h-12 px-10 rounded-2xl font-bold w-full sm:w-auto"
                    >
                        إغلاق
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

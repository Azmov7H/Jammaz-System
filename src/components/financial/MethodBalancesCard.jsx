'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { cn } from '@/utils';

const METHODS = [
    { key: 'cash', label: 'كاش' },
    { key: 'bank', label: 'بنك' },
    { key: 'wallet', label: 'محفظة' },
    { key: 'instapay', label: 'انستا باي' },
    { key: 'check', label: 'شيك' },
    // FIN-TAHWEESH-04 (T-13): set-aside account — isolated from operating
    // totals by construction (backend exclusions), shown here for the full
    // funds picture.
    { key: 'tahweesh', label: 'تحويش (مرصود)' },
];

export function MethodBalancesCard({ breakdown = {}, total = 0, className }) {
    const rows = METHODS.map((m) => ({ ...m, value: Number(breakdown[m.key]) || 0 }));
    const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
    const methodsSum = rows.reduce((s, r) => s + r.value, 0);

    return (
        <Card className={cn('glass-card border-white/5 shadow-xl overflow-hidden', className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Wallet className="h-5 w-5" />
                    </span>
                    أرصدة الوسائل
                    <span className="text-xs font-medium text-muted-foreground">صافي تراكمي لكل وسيلة</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                {rows.map((r) => (
                    <div key={r.key} className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-bold">{r.label}</span>
                            <span
                                dir="ltr"
                                className={cn(
                                    'text-sm font-bold tabular-nums',
                                    r.value < 0 ? 'text-destructive' : r.value > 0 ? 'text-success' : 'text-muted-foreground'
                                )}
                            >
                                {r.value.toLocaleString()} ج.م
                            </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden" dir="ltr">
                            <div
                                className={cn('h-full rounded-full', r.value < 0 ? 'bg-destructive' : 'bg-success')}
                                style={{ width: `${(Math.abs(r.value) / maxAbs) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
                <div className="flex items-baseline justify-between gap-2 border-t border-white/10 pt-3">
                    <span className="text-sm font-bold">مجموع الوسائل</span>
                    <span dir="ltr" className="text-base font-bold tabular-nums">
                        {methodsSum.toLocaleString()} ج.م
                    </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                    الرصيد الكلي المعروض: {Number(total).toLocaleString()} ج.م
                </p>
            </CardContent>
        </Card>
    );
}

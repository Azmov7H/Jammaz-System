'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeftRight,
    TrendingUp,
    TrendingDown,
    Layers,
    Package,
    Undo2
} from 'lucide-react';
import { cn } from '@/utils';

/** Shared movement-type badge used by both desktop rows and mobile cards. */
export const MovementTypeBadge = ({ type }) => {
    const variants = {
        'IN': { variant: "default", label: 'إدخال (شراء)', className: "bg-success/10 text-success border-success/20", icon: TrendingUp },
        'OUT': { variant: "destructive", label: 'إخراج', className: "bg-destructive/10 text-destructive border-destructive/20", icon: TrendingDown },
        'TRANSFER_TO_SHOP': { variant: "secondary", label: 'تحويل للمحل', className: "bg-info/10 text-info border-info/20", icon: ArrowLeftRight },
        'TRANSFER_TO_WAREHOUSE': { variant: "outline", label: 'إرجاع للمخزن', className: "bg-info/10 text-info border-info/20", icon: ArrowLeftRight },
        'TRANSFER': { variant: "secondary", label: 'تحويل بين المخازن', className: "bg-info/10 text-info border-info/20", icon: ArrowLeftRight },
        'REVERSAL': { variant: "outline", label: 'تراجع عن تحويل', className: "bg-warning/10 text-warning border-warning/25", icon: Undo2 },
        'ADJUST': { variant: "outline", label: 'تسوية جردية', className: "bg-warning/10 text-warning border-warning/20", icon: Layers },
    };

    const config = variants[type] || { variant: "default", label: type, className: "bg-muted500/10 text-muted-foreground", icon: Package };
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn("gap-1.5 py-1 px-3 font-bold", config.className)}>
            <Icon size={12} />
            {config.label}
        </Badge>
    );
};

/**
 * Mobile card fallback for the stock movements feed (FE-RWD-001).
 */
export const MovementCard = React.memo(({ movement }) => {
    const m = movement;
    return (
        <div className="glass-card border border-white/10 rounded-3xl p-4 bg-white/[0.02] transition-all duration-300">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-white/5 rounded-xl shrink-0">
                        <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm truncate leading-tight">
                            {m.productId?.name || 'منتج غير معروف'}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground/50 tracking-widest uppercase">{m.productId?.code}</span>
                    </div>
                </div>
                <MovementTypeBadge type={m.type} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tabular-nums tracking-tighter">{m.qty}</span>
                    <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">الكمية</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-muted-foreground/70">
                        {new Date(m.date).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })} • {new Date(m.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                        بواسطة: {m.createdBy?.name || 'غير معروف'}
                    </span>
                </div>
            </div>
        </div>
    );
});

MovementCard.displayName = 'MovementCard';

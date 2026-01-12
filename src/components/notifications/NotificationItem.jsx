'use client';

import { motion } from 'framer-motion';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle2,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const NOTIFICATION_TYPES = {
    CRITICAL: {
        icon: AlertCircle,
        color: 'text-red-500',
        borderColor: 'border-red-500/20',
        bgAccent: 'bg-red-500/[0.02]'
    },
    WARNING: {
        icon: AlertTriangle,
        color: 'text-amber-500',
        borderColor: 'border-amber-500/20',
        bgAccent: 'bg-amber-500/[0.02]'
    },
    SUCCESS: {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        borderColor: 'border-emerald-500/20',
        bgAccent: 'bg-emerald-500/[0.02]'
    },
    INFO: {
        icon: Info,
        color: 'text-foreground/60',
        borderColor: 'border-border',
        bgAccent: 'bg-muted/5'
    }
};

export function NotificationItem({ notification, onMarkRead, onDelete, index }) {
    const isRead = notification.isRead;
    const typeKey = notification.type || 'INFO';
    const config = NOTIFICATION_TYPES[typeKey] || NOTIFICATION_TYPES.INFO;
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
                "group relative flex items-start gap-3 p-3.5 rounded-md border transition-colors",
                "bg-card text-card-foreground shadow-sm",
                config.borderColor,
                !isRead && [config.bgAccent, "shadow-md shadow-black/[0.02]"],
                isRead && "opacity-80"
            )}
        >
            {/* Type Icon (RTL: Right side) */}
            <div className={cn(
                "mt-0.5 shrink-0 flex items-center justify-center transition-opacity",
                config.color
            )}>
                <Icon size={18} strokeWidth={2.5} className="opacity-75" />
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                    <h4 className={cn(
                        "text-[13px] leading-tight truncate",
                        isRead ? "font-medium text-foreground/70" : "font-bold text-foreground"
                    )}>
                        {notification.title}
                    </h4>

                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                    </span>
                </div>

                <p className={cn(
                    "text-[12px] leading-relaxed truncate text-muted-foreground/90",
                )}>
                    {notification.message}
                </p>
            </div>

            {/* Hover Action: Mark Read */}
            {!isRead && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-sm hover:bg-muted"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(notification._id);
                        }}
                    >
                        <Check size={14} className="text-muted-foreground" />
                    </Button>
                </div>
            )}
        </motion.div>
    );
}

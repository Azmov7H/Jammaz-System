'use client';

import { motion } from 'framer-motion';
import { Check, X, HandCoins, CreditCard, Loader2, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const getTypeIcon = (type) => {
    const iconProps = { size: 18, className: "shrink-0" };
    switch (type) {
        case 'WARNING': return <AlertTriangle {...iconProps} className="text-amber-500" />;
        case 'SUCCESS': return <CheckCircle {...iconProps} className="text-emerald-500" />;
        case 'ERROR': return <XCircle {...iconProps} className="text-rose-500" />;
        default: return <Info {...iconProps} className="text-blue-500" />;
    }
};

export function NotificationItem({ notification, onMarkRead, onDelete, onAction, isActionLoading, index }) {
    const isRead = notification.isRead;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className={cn(
                "relative p-4 rounded-3xl transition-all duration-500 group border glass-card overflow-hidden mb-3",
                !isRead
                    ? "bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border-primary/20 hover:border-primary/40 shadow-lg shadow-primary/5"
                    : "bg-white/5 opacity-70 border-white/5 hover:bg-white/10 hover:opacity-100"
            )}
        >
            {/* Quick action buttons on hover */}
            <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 translate-x-2 group-hover:translate-x-0">
                {!isRead && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 transition-all active:scale-90"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(notification._id);
                        }}
                    >
                        <Check size={14} />
                    </Button>
                )}
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 transition-all active:scale-90"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification._id);
                    }}
                >
                    <X size={14} />
                </Button>
            </div>

            <div className="flex gap-4">
                {/* Icon Container */}
                <div className={cn(
                    "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-500 relative",
                    !isRead
                        ? "glass-card bg-gradient-to-br from-white/20 to-white/5 border border-primary/20 group-hover:scale-110 group-hover:rotate-[5deg] shadow-xl shadow-primary/10"
                        : "bg-white/5 border border-white/5"
                )}>
                    {getTypeIcon(notification.type)}
                    {!isRead && (
                        <div className="absolute -top-1 -right-1">
                            <motion.div
                                className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-primary via-purple-500 to-blue-600 border-2 border-background shadow-lg shadow-primary/50"
                                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                            "text-sm font-bold truncate transition-colors pr-16",
                            !isRead ? "text-foreground" : "text-foreground/60"
                        )}>
                            {notification.title}
                        </h4>
                        <span className="text-[10px] font-bold text-foreground/40 whitespace-nowrap bg-white/5 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-md">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                        </span>
                    </div>
                    <p className={cn(
                        "text-xs font-medium leading-relaxed",
                        !isRead ? "text-foreground/80" : "text-foreground/50"
                    )}>
                        {notification.message}
                    </p>

                    {/* Action Button */}
                    {notification.actionType && !isRead && (
                        <div className="pt-2">
                            <Button
                                size="sm"
                                className="h-9 text-xs font-bold px-4 gap-2 bg-gradient-to-r from-primary to-blue-600 border-0 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all active:scale-95 rounded-xl text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction(notification._id);
                                }}
                                disabled={isActionLoading}
                            >
                                {isActionLoading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    notification.actionType === 'COLLECT_DEBT' ? <HandCoins size={14} /> : <CreditCard size={14} />
                                )}
                                {notification.actionType === 'COLLECT_DEBT' ? 'تأكيد التحصيل' : 'تأكيد السداد'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Subtle glow effect for unread */}
            {!isRead && (
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            )}
        </motion.div>
    );
}

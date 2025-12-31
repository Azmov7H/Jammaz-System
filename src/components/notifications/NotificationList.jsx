'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, Sparkles } from 'lucide-react';
import { isToday, isYesterday } from 'date-fns';
import { NotificationItem } from './NotificationItem';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationList({
    notifications,
    onMarkRead,
    onDelete,
    onAction,
    isActionLoading,
    activeActionId
}) {
    const groupedNotifications = useMemo(() => {
        const groups = {
            today: [],
            yesterday: [],
            earlier: []
        };

        notifications.forEach(notif => {
            const date = new Date(notif.createdAt);
            if (isToday(date)) groups.today.push(notif);
            else if (isYesterday(date)) groups.yesterday.push(notif);
            else groups.earlier.push(notif);
        });

        return groups;
    }, [notifications]);

    if (notifications.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 px-6 text-center"
            >
                <div className="relative mb-6 group">
                    <motion.div
                        className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 group-hover:bg-primary/30 transition-all duration-700"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                    <div className="relative p-12 glass-card bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full border border-primary/20 shadow-2xl backdrop-blur-2xl">
                        <Bell size={64} className="text-primary/40 group-hover:text-primary/60 transition-colors duration-500 group-hover:rotate-12" />
                    </div>
                </div>
                <h4 className="text-lg font-black text-foreground/80 mb-2">لا توجد إشعارات</h4>
                <p className="text-xs text-foreground/40 font-medium">كل شيء على ما يرام! استمتع بيومك ✨</p>
            </motion.div>
        );
    }

    return (
        <ScrollArea className="h-[520px]">
            <div className="p-4 space-y-8 pb-8">
                <AnimatePresence mode="popLayout">
                    {Object.entries(groupedNotifications).map(([key, items]) => {
                        if (items.length === 0) return null;
                        const labels = { today: 'اليوم', yesterday: 'أمس', earlier: 'سابقاً' };

                        return (
                            <div key={key} className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <Clock size={12} className="text-primary" />
                                    </div>
                                    <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40">
                                        {labels[key]}
                                    </h5>
                                    <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
                                </div>
                                <div className="space-y-3">
                                    {items.map((notif, idx) => (
                                        <NotificationItem
                                            key={notif._id}
                                            notification={notif}
                                            index={idx}
                                            onMarkRead={onMarkRead}
                                            onDelete={onDelete}
                                            onAction={onAction}
                                            isActionLoading={isActionLoading && activeActionId === notif._id}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Subtle Footer inside scroll */}
            <div className="p-6 mt-4 flex items-center justify-center gap-2 text-foreground/20">
                <Sparkles size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Smart Core v2.0</span>
            </div>
        </ScrollArea>
    );
}

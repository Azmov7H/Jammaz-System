'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationList({
    notifications,
    onMarkRead,
    onDelete,
}) {
    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="p-4 bg-muted/30 rounded-full mb-4">
                    <Bell size={32} className="text-muted-foreground/40" />
                </div>
                <h4 className="text-[14px] font-bold text-foreground/80 mb-1">لا توجد إشعارات</h4>
                <p className="text-[12px] text-muted-foreground">كل شيء على ما يرام في نظامك.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[440px]">
            <div className="p-3 space-y-2">
                <AnimatePresence initial={false} mode="popLayout">
                    {notifications.map((notif, idx) => (
                        <NotificationItem
                            key={notif._id}
                            notification={notif}
                            index={idx}
                            onMarkRead={onMarkRead}
                            onDelete={onDelete}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ScrollArea>
    );
}

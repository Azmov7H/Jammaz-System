'use client';

import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/utils';

export function NotificationBell({ className, ...props }) {
    const { unreadCount } = useNotifications();

    return (
        <button
            className={cn("relative p-2 rounded-md hover:bg-muted transition-colors group", className)}
            aria-label="الإشعارات"
            {...props}
        >
            <Bell size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />

            {unreadCount > 0 && (
                <span className={cn(
                    "absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
                    "bg-primary border-2 border-background"
                )}>
                    {unreadCount > 9 ? '+9' : unreadCount}
                </span>
            )}
        </button>
    );
}

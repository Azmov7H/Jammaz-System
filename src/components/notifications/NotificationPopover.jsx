'use client';

import { Bell, RefreshCw, Check, Trash2 } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationList } from './NotificationList';
import { NotificationBell } from './NotificationBell';

export function NotificationPopover() {
    const {
        notifications,
        isLoading,
        unreadCount,
        refetch,
        markAsRead,
        deleteNotification,
    } = useNotifications();

    const handleClearAll = () => {
        // Clear all non-critical notifications or just clear all as per business rule
        deleteNotification('all');
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <NotificationBell />
            </PopoverTrigger>

            <PopoverContent
                className="w-80 sm:w-96 p-0 overflow-hidden bg-card border shadow-lg rounded-md mt-2"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-foreground">الإشعارات</span>
                        {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full border border-primary/20">
                                {unreadCount} جديد
                            </span>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-sm text-muted-foreground hover:text-foreground"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
                    </Button>
                </div>

                {/* Content Area */}
                <div className="min-h-[100px] max-h-[480px]">
                    <NotificationList
                        notifications={notifications}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                    />
                </div>

                {/* Footer Actions */}
                {notifications.length > 0 && (
                    <div className="grid grid-cols-2 border-t text-center divide-x divide-x-reverse overflow-hidden">
                        <button
                            onClick={() => markAsRead('all')}
                            className="flex items-center justify-center gap-2 py-3 text-[12px] font-medium text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors"
                        >
                            <Check size={14} />
                            <span>تحديد الكل كمقروء</span>
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="flex items-center justify-center gap-2 py-3 text-[12px] font-medium text-muted-foreground hover:text-destructive hover:bg-muted/30 transition-colors"
                        >
                            <Trash2 size={14} />
                            <span>مسح الكل</span>
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

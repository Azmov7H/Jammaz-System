'use client';

import { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function NotificationPopover() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.notifications.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (ids = 'all') => {
        try {
            const res = await fetch('/api/notifications/mark-read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (res.ok) {
                if (ids === 'all') {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    setUnreadCount(0);
                    toast.success('تم تحديد الكل كمقروء');
                }
            }
        } catch (error) {
            toast.error('فشل التحديث');
        }
    };

    const getTypeIcon = (type) => {
        const iconProps = { size: 16, className: "shrink-0" };
        switch (type) {
            case 'WARNING': return <AlertTriangle {...iconProps} className="text-amber-500" />;
            case 'SUCCESS': return <CheckCircle {...iconProps} className="text-green-500" />;
            case 'ERROR': return <XCircle {...iconProps} className="text-red-500" />;
            default: return <Info {...iconProps} className="text-blue-500" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-sm">الإشعارات</h3>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={fetchNotifications}
                            disabled={loading}
                        >
                            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                        </Button>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => markAsRead('all')}
                            >
                                قراءة الكل
                            </Button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Bell size={32} className="mb-2 opacity-20" />
                            <p className="text-sm">لا توجد إشعارات جديدة</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    className={cn(
                                        "p-3 hover:bg-muted/50 transition-colors",
                                        !notif.isRead && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1">
                                            {getTypeIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={cn(
                                                    "text-sm font-medium truncate",
                                                    !notif.isRead ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {notif.title}
                                                </h4>
                                                {!notif.isRead && (
                                                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground/60">
                                                {new Date(notif.createdAt).toLocaleDateString('ar-SA', {
                                                    hour: 'numeric',
                                                    minute: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, RefreshCw, HandCoins, CreditCard, Loader2, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function NotificationPopover() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
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
        const interval = setInterval(fetchNotifications, 60000);
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

    const handleAction = async (notifId) => {
        setActionLoading(notifId);
        try {
            const res = await fetch('/api/notifications/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: notifId })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'تمت العملية بنجاح');
                fetchNotifications();
            } else {
                toast.error(data.error || 'فشلت العملية');
            }
        } catch (error) {
            toast.error('خطأ في الاتصال بالخادم');
        } finally {
            setActionLoading(null);
        }
    };

    const getTypeIcon = (type) => {
        const iconProps = { size: 18, className: "shrink-0" };
        switch (type) {
            case 'WARNING': return <AlertTriangle {...iconProps} className="text-amber-500" />;
            case 'SUCCESS': return <CheckCircle {...iconProps} className="text-emerald-500" />;
            case 'ERROR': return <XCircle {...iconProps} className="text-rose-500" />;
            default: return <Info {...iconProps} className="text-sky-500" />;
        }
    };

    // Grouping Logic
    const groupedNotifications = useMemo(() => {
        const groups = {
            today: [],
            yesterday: [],
            earlier: []
        };

        notifications.forEach(notif => {
            const date = new Date(notif.createdAt);
            if (isToday(date)) {
                groups.today.push(notif);
            } else if (isYesterday(date)) {
                groups.yesterday.push(notif);
            } else {
                groups.earlier.push(notif);
            }
        });

        return groups;
    }, [notifications]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group hover:bg-primary/10 transition-colors duration-300">
                    <Bell size={20} className="text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:rotate-12" />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-0.5 -right-0.5"
                            >
                                <Badge
                                    variant="destructive"
                                    className="h-5 w-5 flex items-center justify-center p-0 text-[10px] shadow-glow-sm animate-pulse border-2 border-background"
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Badge>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[380px] p-0 overflow-hidden glass-card border-white/20 shadow-custom-2xl rounded-3xl animate-in zoom-in-95 duration-200"
                align="end"
                sideOffset={12}
            >
                {/* Header Section */}
                <div className="relative p-5 bg-gradient-to-br from-primary/10 via-background to-background border-b border-primary/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                                <span className="w-2 h-6 gradient-primary rounded-full" />
                                مركز الإشعارات
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5 px-4">
                                لديك {unreadCount} تنبيهات غير مقروءة
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl hover:bg-primary/20 transition-all active:scale-95"
                                onClick={fetchNotifications}
                                disabled={loading}
                            >
                                <RefreshCw size={16} className={cn("text-primary", loading && "animate-spin")} />
                            </Button>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300"
                                    onClick={() => markAsRead('all')}
                                >
                                    قراءة الكل
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <ScrollArea className="h-[450px]">
                    <AnimatePresence mode="popLayout">
                        {notifications.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-muted-foreground"
                            >
                                <div className="relative mb-4">
                                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                                    <div className="relative p-6 bg-muted/40 rounded-full border border-primary/10">
                                        <Bell size={40} className="text-primary/40" />
                                    </div>
                                </div>
                                <p className="text-sm font-bold opacity-60">صندوق الإشعارات فارغ حالياً</p>
                                <p className="text-[10px] mt-1 opacity-40">كل شيء يبدو على ما يرام!</p>
                            </motion.div>
                        ) : (
                            <div className="p-2 space-y-6 pb-6">
                                {Object.entries(groupedNotifications).map(([key, items]) => {
                                    if (items.length === 0) return null;
                                    const labels = { today: 'اليوم', yesterday: 'أمس', earlier: 'سابقاً' };

                                    return (
                                        <div key={key} className="space-y-3">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-3 flex items-center gap-2">
                                                <Clock size={10} /> {labels[key]}
                                                <span className="h-[1px] flex-1 bg-gradient-to-r from-muted/50 to-transparent" />
                                            </h5>
                                            <div className="space-y-2">
                                                {items.map((notif, idx) => (
                                                    <motion.div
                                                        key={notif._id}
                                                        layout
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className={cn(
                                                            "relative p-4 rounded-2xl transition-all duration-300 group border-transparent",
                                                            !notif.isRead
                                                                ? "bg-gradient-to-l from-primary/[0.08] to-transparent border-primary/10 hover:border-primary/20 shadow-sm"
                                                                : "bg-muted/5 opacity-80 border-transparent hover:bg-muted/10"
                                                        )}
                                                    >
                                                        <div className="flex gap-4">
                                                            <div className={cn(
                                                                "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                                                                !notif.isRead ? "bg-white shadow-glow-sm" : "bg-muted/40"
                                                            )}>
                                                                {getTypeIcon(notif.type)}
                                                                {!notif.isRead && (
                                                                    <div className="absolute -top-1 -right-1">
                                                                        <div className="w-3 h-3 rounded-full bg-primary border-2 border-white animate-pulse shadow-glow" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <h4 className={cn(
                                                                        "text-sm font-bold truncate transition-colors",
                                                                        !notif.isRead ? "text-foreground" : "text-muted-foreground/80"
                                                                    )}>
                                                                        {notif.title}
                                                                    </h4>
                                                                    <span className="text-[9px] font-bold text-muted-foreground/50 whitespace-nowrap bg-muted/60 px-2 py-0.5 rounded-full">
                                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ar })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                                                    {notif.message}
                                                                </p>

                                                                {/* Quick Actions with improved UI */}
                                                                {notif.actionType && !notif.isRead && (
                                                                    <div className="pt-3">
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-8 text-[11px] font-black px-4 gap-2 gradient-primary border-0 shadow-colored-sm hover:scale-[1.02] transition-transform active:scale-95"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleAction(notif._id);
                                                                            }}
                                                                            disabled={actionLoading === notif._id}
                                                                        >
                                                                            {actionLoading === notif._id ? (
                                                                                <Loader2 size={12} className="animate-spin" />
                                                                            ) : (
                                                                                notif.actionType === 'COLLECT_DEBT' ? <HandCoins size={14} /> : <CreditCard size={14} />
                                                                            )}
                                                                            {notif.actionType === 'COLLECT_DEBT' ? 'تأكيد تحصيل القيمة الآن' : 'تأكيد السداد والتوريد'}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>
                </ScrollArea>

                {/* Footer Section */}
                <div className="p-4 bg-muted/20 border-t border-primary/5 flex items-center justify-between">
                    <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tighter">
                        Smart Notification System v2.0
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-50 gap-1.5 font-bold"
                    >
                        <Trash2 size={12} /> مسح السجل
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

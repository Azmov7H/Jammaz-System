'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, RefreshCw, HandCoins, CreditCard, Loader2, Clock, Trash2, Sparkles, Check, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function NotificationPopover() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
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
            console.log('Marking as read:', ids);
            const res = await fetch('/api/notifications/mark-read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });

            const data = await res.json();
            console.log('Mark as read response:', data);

            if (res.ok && data.success) {
                if (ids === 'all') {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    setUnreadCount(0);
                    toast.success('تم تحديد الكل كمقروء');
                } else {
                    setNotifications(prev => prev.map(n =>
                        n._id === ids ? { ...n, isRead: true } : n
                    ));
                    setUnreadCount(prev => Math.max(0, prev - 1));
                    toast.success('تم تحديد كمقروء');
                }
            } else {
                console.error('Mark as read failed:', data);
                toast.error(data.error || 'فشل التحديث');
            }
        } catch (error) {
            console.error('Mark as read error:', error);
            toast.error('خطأ في الاتصال: ' + error.message);
        }
    };

    const deleteAllNotifications = async () => {
        setDeleteLoading(true);
        try {
            console.log('Deleting all notifications');
            const res = await fetch('/api/notifications', {
                method: 'DELETE'
            });

            const data = await res.json();
            console.log('Delete all response:', data);

            if (res.ok && data.success) {
                setNotifications([]);
                setUnreadCount(0);
                toast.success('تم حذف جميع الإشعارات');
            } else {
                console.error('Delete all failed:', data);
                toast.error(data.error || 'فشل حذف الإشعارات');
            }
        } catch (error) {
            console.error('Delete all error:', error);
            toast.error('خطأ في الحذف: ' + error.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    const deleteNotification = async (id) => {
        try {
            console.log('Deleting notification:', id);
            const res = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();
            console.log('Delete notification response:', data);

            if (res.ok && data.success) {
                const notif = notifications.find(n => n._id === id);
                setNotifications(prev => prev.filter(n => n._id !== id));
                if (notif && !notif.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                toast.success('تم حذف الإشعار');
            } else {
                console.error('Delete notification failed:', data);
                toast.error(data.error || 'فشل حذف الإشعار');
            }
        } catch (error) {
            console.error('Delete notification error:', error);
            toast.error('خطأ في الحذف: ' + error.message);
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
            default: return <Info {...iconProps} className="text-blue-500" />;
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
                <Button variant="ghost" size="icon" className="relative group hover:bg-purple-500/10 transition-all duration-300 rounded-2xl">
                    <Bell size={20} className="text-foreground/70 group-hover:text-purple-500 transition-all duration-300 group-hover:rotate-[15deg] group-hover:scale-110" />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0, rotate: 0 }}
                                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute -top-1 -right-1"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-md animate-pulse" />
                                    <Badge className="relative h-5 min-w-[20px] flex items-center justify-center p-0 px-1.5 text-[10px] font-black bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 border-2 border-background shadow-lg shadow-purple-500/50">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Badge>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[420px] p-0 overflow-hidden glass-card border-purple-500/20 shadow-2xl rounded-[2.5rem] animate-in zoom-in-95 duration-300"
                align="end"
                sideOffset={16}
            >
                {/* Header Section */}
                <div className="relative p-6 glass-card bg-gradient-to-br from-purple-600/15 via-blue-600/10 to-transparent border-b border-white/10 overflow-hidden">
                    {/* Animated gradient orbs */}
                    <motion.div
                        className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.3, 0.2]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/15 rounded-full blur-2xl"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.15, 0.25, 0.15]
                        }}
                        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                    />

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg shadow-purple-500/30">
                                    <Bell className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">مركز الإشعارات</h3>
                                    <p className="text-[10px] text-foreground/50 font-medium">
                                        {unreadCount > 0 ? `${unreadCount} تنبيه جديد` : 'لا توجد تنبيهات'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl hover:bg-purple-500/10 transition-all active:scale-90"
                                onClick={fetchNotifications}
                                disabled={loading}
                            >
                                <RefreshCw size={16} className={cn("text-purple-500", loading && "animate-spin")} />
                            </Button>
                        </div>

                        {/* Action Buttons */}
                        {(unreadCount > 0 || notifications.length > 0) && (
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <Button
                                        size="sm"
                                        className="flex-1 h-9 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 gap-2"
                                        onClick={() => markAsRead('all')}
                                    >
                                        <Check size={14} />
                                        قراءة الكل
                                    </Button>
                                )}
                                {notifications.length > 0 && (
                                    <Button
                                        size="sm"
                                        className="flex-1 h-9 text-xs font-bold rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 gap-2"
                                        onClick={deleteAllNotifications}
                                        disabled={deleteLoading}
                                    >
                                        {deleteLoading ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                        حذف الكل
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <ScrollArea className="h-[480px]">
                    <AnimatePresence mode="popLayout">
                        {notifications.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-24 px-6 text-center"
                            >
                                <div className="relative mb-6">
                                    <motion.div
                                        className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <div className="relative p-10 glass-card bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-[2rem] border border-purple-500/20">
                                        <Bell size={56} className="text-purple-500/40" />
                                    </div>
                                </div>
                                <p className="text-base font-bold text-foreground/70 mb-2">لا توجد إشعارات</p>
                                <p className="text-xs text-foreground/40">كل شيء على ما يرام! ✨</p>
                            </motion.div>
                        ) : (
                            <div className="p-4 space-y-6 pb-6">
                                {Object.entries(groupedNotifications).map(([key, items]) => {
                                    if (items.length === 0) return null;
                                    const labels = { today: 'اليوم', yesterday: 'أمس', earlier: 'سابقاً' };

                                    return (
                                        <div key={key} className="space-y-2">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2 flex items-center gap-2">
                                                <Clock size={11} className="text-purple-500/60" />
                                                {labels[key]}
                                                <span className="h-px flex-1 bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent" />
                                            </h5>
                                            <div className="space-y-2">
                                                {items.map((notif, idx) => (
                                                    <motion.div
                                                        key={notif._id}
                                                        layout
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20, height: 0 }}
                                                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                                                        className={cn(
                                                            "relative p-4 rounded-2xl transition-all duration-300 group border glass-card overflow-hidden",
                                                            !notif.isRead
                                                                ? "bg-gradient-to-l from-purple-500/15 via-purple-500/8 to-blue-500/5 border-purple-500/30 hover:border-purple-500/40 shadow-lg shadow-purple-500/10"
                                                                : "bg-white/5 opacity-60 border-white/5 hover:bg-white/10 hover:opacity-80"
                                                        )}
                                                    >
                                                        {/* Quick action buttons */}
                                                        <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                            {!notif.isRead && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 hover:text-emerald-600 transition-all"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markAsRead(notif._id);
                                                                    }}
                                                                >
                                                                    <Check size={14} />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-500 hover:text-red-600 transition-all"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteNotification(notif._id);
                                                                }}
                                                            >
                                                                <X size={14} />
                                                            </Button>
                                                        </div>

                                                        <div className="flex gap-4">
                                                            <div className={cn(
                                                                "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300 relative",
                                                                !notif.isRead
                                                                    ? "glass-card bg-gradient-to-br from-white/15 to-white/5 border border-purple-500/20 group-hover:scale-110 shadow-lg"
                                                                    : "bg-white/5 border border-white/5"
                                                            )}>
                                                                {getTypeIcon(notif.type)}
                                                                {!notif.isRead && (
                                                                    <div className="absolute -top-1 -right-1">
                                                                        <motion.div
                                                                            className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 border-2 border-background shadow-lg shadow-purple-500/50"
                                                                            animate={{ scale: [1, 1.2, 1] }}
                                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-2">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <h4 className={cn(
                                                                        "text-sm font-bold truncate transition-colors pr-16",
                                                                        !notif.isRead ? "text-foreground" : "text-foreground/60"
                                                                    )}>
                                                                        {notif.title}
                                                                    </h4>
                                                                    <span className="text-[9px] font-bold text-foreground/40 whitespace-nowrap glass-card bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ar })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs font-medium text-foreground/70 leading-relaxed">
                                                                    {notif.message}
                                                                </p>

                                                                {/* Quick Actions */}
                                                                {notif.actionType && !notif.isRead && (
                                                                    <div className="pt-2">
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-9 text-xs font-bold px-4 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 border-0 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] transition-all active:scale-95 rounded-xl"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleAction(notif._id);
                                                                            }}
                                                                            disabled={actionLoading === notif._id}
                                                                        >
                                                                            {actionLoading === notif._id ? (
                                                                                <Loader2 size={14} className="animate-spin" />
                                                                            ) : (
                                                                                notif.actionType === 'COLLECT_DEBT' ? <HandCoins size={14} /> : <CreditCard size={14} />
                                                                            )}
                                                                            {notif.actionType === 'COLLECT_DEBT' ? 'تأكيد التحصيل' : 'تأكيد السداد'}
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
                {notifications.length > 0 && (
                    <div className="p-4 glass-card bg-gradient-to-b from-purple-500/5 to-transparent border-t border-white/10 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-foreground/40">
                            <Sparkles size={12} className="text-purple-500/60" />
                            <p className="text-[10px] font-bold uppercase tracking-wider">
                                Smart Notification System
                            </p>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

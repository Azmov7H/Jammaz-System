'use client';

import { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, RefreshCw, HandCoins, CreditCard, Loader2, Sparkles, Trash2, Check, ArrowRight, Wallet, Package } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
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
        const optimisticUpdate = (isRead) => {
            if (ids === 'all') {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            } else {
                setNotifications(prev => prev.map(n => n._id === ids ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        };

        optimisticUpdate(true);

        try {
            const res = await fetch('/api/notifications/mark-read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });

            if (!res.ok) throw new Error('Failed to sync');
            toast.success(ids === 'all' ? 'تم قراءة الكل' : 'تم قراءة الإشعار');
        } catch (error) {
            toast.error('فشل في تحديث الحالة');
            fetchNotifications(); // Revert on error
        }
    };

    const deleteNotification = async (idOfAll) => {
        if (idOfAll === 'all') setDeleteLoading(true);
        const backup = [...notifications];

        try {
            if (idOfAll === 'all') {
                setNotifications([]);
                setUnreadCount(0);
            } else {
                const notif = notifications.find(n => n._id === idOfAll);
                setNotifications(prev => prev.filter(n => n._id !== idOfAll));
                if (notif && !notif.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
            }

            const url = idOfAll === 'all' ? '/api/notifications' : `/api/notifications/${idOfAll}`;
            const method = 'DELETE';

            const res = await fetch(url, { method });
            if (!res.ok) throw new Error('Failed to delete');

            toast.success(idOfAll === 'all' ? 'تم تنظيف الإشعارات' : 'تم الحذف بنجاح');
        } catch (error) {
            toast.error('فشل الحذف');
            setNotifications(backup); // Revert
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleAction = async (notifId, type) => {
        setActionLoading(notifId);
        try {
            const res = await fetch('/api/notifications/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: notifId })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'تم بنجاح');
                markAsRead(notifId);
            } else {
                toast.error(data.error || 'حدث خطأ');
            }
        } catch (error) {
            toast.error('خطأ في الاتصال');
        } finally {
            setActionLoading(null);
        }
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'CRITICAL': return { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-500', icon: AlertTriangle };
            case 'WARNING': return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', icon: AlertTriangle };
            case 'SUCCESS': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', icon: CheckCircle };
            case 'OPPORTUNITY': return { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-500', icon: Sparkles };
            default: return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500', icon: Info };
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group rounded-xl hover:bg-muted/50 transition-all duration-300">
                    <div className={cn(
                        "transition-all duration-500",
                        unreadCount > 0 ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
                    )}>
                        <Bell size={20} className={cn("transition-transform duration-500", unreadCount > 0 && "group-hover:rotate-[15deg]")} />
                    </div>
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-2 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-background"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[95vw] sm:w-[420px] p-0 overflow-hidden glass-card border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-[2rem] animate-in zoom-in-95 duration-200"
                align="end"
                sideOffset={20}
            >
                {/* Header */}
                <div className="relative p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-primary to-primary/50 rounded-xl shadow-lg shadow-primary/20">
                                <Bell className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-black tracking-tight">الإشعارات</h3>
                                <p className="text-[10px] text-muted-foreground font-medium">
                                    {unreadCount > 0 ? `لديك ${unreadCount} إشعار جديد` : 'لا توجد إشعارات جديدة'}
                                </p>
                            </div>
                        </div>
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification('all')}
                                disabled={deleteLoading}
                                className="h-8 w-8 p-0 rounded-full hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                            >
                                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={16} />}
                            </Button>
                        )}
                    </div>

                    {/* Quick Filters / Actions */}
                    {unreadCount > 0 && (
                        <Button
                            onClick={() => markAsRead('all')}
                            className="w-full h-9 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all"
                        >
                            <Check className="w-3.5 h-3.5 mr-2" />
                            تحديد الكل كمقروء
                        </Button>
                    )}
                </div>

                {/* List */}
                <ScrollArea className="h-[60vh] sm:h-[500px] bg-background/40 backdrop-blur-md">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-xs text-muted-foreground">جاري التحديث...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
                            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-10 h-10 text-muted-foreground/40" />
                            </div>
                            <h4 className="text-sm font-bold text-foreground/80 mb-1">لا توجد إشعارات</h4>
                            <p className="text-xs text-muted-foreground max-w-[200px]">
                                سيظهر هنا أي نشاط مهم في النظام فور حدوثه.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            <AnimatePresence>
                                {notifications.map((notif) => {
                                    const style = getTypeStyles(notif.category || 'INFO');
                                    const NotifIcon = style.icon;

                                    return (
                                        <motion.div
                                            key={notif._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            onClick={() => !notif.isRead && markAsRead(notif._id)}
                                            className={cn(
                                                "p-4 hover:bg-white/5 transition-all cursor-pointer relative group",
                                                !notif.isRead && "bg-primary/[0.02]"
                                            )}
                                        >
                                            {!notif.isRead && (
                                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                            )}

                                            <div className="flex gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all mt-1",
                                                    style.bg, style.border, style.text
                                                )}>
                                                    <NotifIcon size={18} />
                                                </div>

                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className={cn("text-xs font-bold leading-none", !notif.isRead ? "text-foreground" : "text-muted-foreground")}>
                                                            {notif.title}
                                                        </p>
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ar })}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                        {notif.message}
                                                    </p>

                                                    {notif.actionType && !notif.isRead && (
                                                        <div className="pt-2">
                                                            <Button
                                                                size="sm"
                                                                className={cn(
                                                                    "h-7 text-[10px] w-full bg-white/5 hover:bg-primary hover:text-white transition-all border border-white/10 rounded-lg",
                                                                    actionLoading === notif._id && "opacity-50 pointer-events-none"
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAction(notif._id, notif.actionType);
                                                                }}
                                                            >
                                                                {actionLoading === notif._id ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                                                                    notif.actionType === 'COLLECT_DEBT' ? 'تأكيد التحصيل' : 'اتخاذ إجراء'
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 bg-black/20 text-center">
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">
                        Smart Notification System
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}

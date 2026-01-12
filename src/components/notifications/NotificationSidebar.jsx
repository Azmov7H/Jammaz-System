'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Trash2, Check, RefreshCw, HandCoins, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useNotificationCenter } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';

export function NotificationSidebar() {
    const {
        notifications,
        isSidebarOpen,
        setIsSidebarOpen,
        markAsRead,
        deleteNotification,
        performAction,
        loading,
        actionLoadingId,
        refresh
    } = useNotificationCenter();

    const grouped = notifications.reduce((acc, notif) => {
        const date = new Date(notif.createdAt);
        if (isToday(date)) acc.today.push(notif);
        else if (isYesterday(date)) acc.yesterday.push(notif);
        else acc.earlier.push(notif);
        return acc;
    }, { today: [], yesterday: [], earlier: [] });

    return (
        <AnimatePresence>
            {isSidebarOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-[100vw] sm:w-[450px] bg-background/80 backdrop-blur-3xl border-l border-white/10 z-[1000] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 space-y-6 bg-gradient-to-b from-primary/10 to-transparent border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/20 rounded-2xl border border-primary/30">
                                        <Bell className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">مركز الإشعارات</h2>
                                        <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-widest">Notification Center v2.0</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="rounded-full hover:bg-white/10"
                                >
                                    <X size={20} />
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 rounded-xl bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 text-[11px] font-black uppercase tracking-wider"
                                    onClick={() => markAsRead('all')}
                                >
                                    <Check size={14} className="mr-2" /> تحديد الكل كمقروء
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-white/10 hover:bg-white/5 text-foreground/50"
                                    onClick={refresh}
                                    disabled={loading}
                                >
                                    <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        <ScrollArea className="flex-1">
                            {notifications.length === 0 ? (
                                <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8 gap-4">
                                    <div className="p-12 bg-white/5 rounded-full border border-white/5 relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                        <Bell size={64} className="text-foreground/20 relative z-10" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground/60">لا توجد إشعارات حالياً</h3>
                                    <p className="text-sm text-foreground/40">كل شيء يبدو هادئاً هنا ✨</p>
                                </div>
                            ) : (
                                <div className="p-6 space-y-10 pb-20">
                                    {Object.entries(grouped).map(([key, items]) => {
                                        if (items.length === 0) return null;
                                        const labels = { today: 'اليوم', yesterday: 'أمس', earlier: 'سابقاً' };
                                        return (
                                            <div key={key} className="space-y-4">
                                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-4">
                                                    {labels[key]}
                                                    <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                                </h4>
                                                <div className="space-y-3">
                                                    {items.map((notif, idx) => (
                                                        <NotificationSidebarItem
                                                            key={notif._id}
                                                            notif={notif}
                                                            markAsRead={markAsRead}
                                                            deleteNotification={deleteNotification}
                                                            performAction={performAction}
                                                            actionLoadingId={actionLoadingId}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-6 border-t border-white/5 bg-black/10 backdrop-blur-md">
                                <Button
                                    variant="ghost"
                                    className="w-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 font-bold text-xs gap-2 rounded-xl"
                                    onClick={() => deleteNotification('all')}
                                >
                                    <Trash2 size={16} /> مسح سجل الإشعارات بالكامل
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function NotificationSidebarItem({ notif, markAsRead, deleteNotification, performAction, actionLoadingId }) {
    const isRead = notif.isRead;
    const isLoading = actionLoadingId === notif._id;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative p-4 rounded-[2rem] transition-all duration-300 border",
                !isRead
                    ? "bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 shadow-lg shadow-primary/5"
                    : "bg-white/5 border-white/5 transparency-hover"
            )}
        >
            <div className="flex gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500",
                    !isRead ? "bg-white/10 border-white/20 group-hover:scale-110" : "bg-white/5 border-white/5"
                )}>
                    <Bell className={cn("w-5 h-5", !isRead ? "text-primary" : "text-foreground/40")} />
                    {!isRead && (
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-lg shadow-primary" />
                    )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                        <h5 className={cn("text-sm font-bold truncate", isRead && "text-foreground/60")}>
                            {notif.title}
                        </h5>
                        <span className="text-[10px] font-bold text-foreground/30 whitespace-nowrap">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ar })}
                        </span>
                    </div>
                    <p className={cn("text-xs leading-relaxed", !isRead ? "text-foreground/80" : "text-foreground/40")}>
                        {notif.message}
                    </p>

                    {notif.actionType && !isRead && (
                        <div className="pt-2">
                            <Button
                                size="sm"
                                className="h-9 w-full rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-[11px] gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                                onClick={() => performAction(notif._id)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin w-4 h-4" />
                                ) : (
                                    notif.actionType === 'COLLECT_DEBT' ? <HandCoins className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />
                                )}
                                {notif.actionType === 'COLLECT_DEBT' ? 'تأكيد التحصيل الآن' : 'تأكيد السداد الآن'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions overlay */}
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {!isRead && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                        onClick={() => markAsRead(notif._id)}
                    >
                        <Check size={14} />
                    </Button>
                )}
                <Button
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                    onClick={() => deleteNotification(notif._id)}
                >
                    <Trash2 size={14} />
                </Button>
            </div>
        </motion.div>
    );
}

'use client';

import { Bell, RefreshCw, Trash2, Check, Loader2, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationList } from './NotificationList';

export default function NotificationPopover() {
    const {
        notifications,
        isLoading,
        unreadCount,
        refetch,
        markAsRead,
        deleteNotification,
        performAction,
        isActionLoading,
        activeActionId
    } = useNotifications();

    return (
        <Popover className={"h-auto"}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative group hover:bg-primary/10 transition-all duration-500 rounded-2xl active:scale-90"
                >
                    <Bell
                        size={22}
                        className="text-foreground/60 group-hover:text-primary transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-110"
                    />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, scale: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                className="absolute -top-1 -right-1"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/40 rounded-full blur-md animate-pulse" />
                                    <Badge className="relative h-5 min-w-[20px] flex items-center justify-center p-0 px-1.5 text-[10px] font-black bg-gradient-to-br from-primary via-purple-600 to-primary border-2 border-background shadow-lg shadow-primary/40 ring-1 ring-white/20">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Badge>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[440px] p-0 overflow-hidden glass-card border-primary/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] rounded-[2.5rem] animate-in zoom-in-95 data-[side=bottom]:slide-in-from-top-4 duration-500 backdrop-blur-3xl"
                align="end"
                sideOffset={16}
            >
                {/* Header Section */}
                <div className="relative p-8 overflow-hidden bg-gradient-to-br from-primary/20 via-blue-500/10 to-transparent border-b border-white/5">
                    {/* Abstract background elements */}
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-blue-500/5 rounded-full blur-[60px]" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative group/icon">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl group-hover/icon:bg-primary/40 transition-all duration-500" />
                                    <div className="relative p-3 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-2xl shadow-primary/30 border border-white/20 group-hover/icon:scale-110 transition-transform duration-500">
                                        <Bell className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-xl font-black tracking-tight text-foreground">الإشعارات</h3>
                                    <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-wider">
                                        {unreadCount > 0 ? `${unreadCount} تنبيهات غير مقروءة` : 'لا توجد تنبيهات جديدة'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all active:scale-90 border border-transparent hover:border-primary/20"
                                    onClick={() => refetch()}
                                    disabled={isLoading}
                                >
                                    <RefreshCw size={18} className={cn("text-primary/70", isLoading && "animate-spin")} />
                                </Button>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {(unreadCount > 0 || notifications.length > 0) && (
                            <div className="flex gap-3">
                                {unreadCount > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-10 text-[11px] font-black rounded-2xl bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 gap-2 uppercase tracking-wider"
                                        onClick={() => markAsRead('all')}
                                    >
                                        <Check size={14} />
                                        تحديد الكل كمقروء
                                    </Button>
                                )}
                                {notifications.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-10 text-[11px] font-black rounded-2xl bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/30 transition-all duration-300 gap-2 uppercase tracking-wider"
                                        onClick={() => deleteNotification('all')}
                                    >
                                        <Trash2 size={14} />
                                        حذف السجل
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="relative min-h-[400px]">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                                <Loader2 size={40} className="text-primary animate-spin" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">جارِ المزامنة...</p>
                        </div>
                    ) : (
                        <NotificationList
                            notifications={notifications}
                            onMarkRead={markAsRead}
                            onDelete={deleteNotification}
                            onAction={performAction}
                            isActionLoading={isActionLoading}
                            activeActionId={activeActionId}
                        />
                    )}
                </div>

                {/* Status Bar */}
                <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between px-8">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">متصل بالخادم</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-[10px] font-black text-foreground/30 hover:text-primary transition-colors">
                        <Settings2 size={12} className="mr-2" />
                        إعدادات التنبيه
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

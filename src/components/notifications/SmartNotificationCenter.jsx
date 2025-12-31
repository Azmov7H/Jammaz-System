'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Bell,
    Search,
    Filter,
    AlertCircle,
    Wallet,
    Package,
    CheckCircle2,
    Clock,
    Trash2,
    ArrowRight,
    Loader2,
    Calendar,
    ChevronLeft,
    Sparkles,
    TrendingUp,
    Zap,
    Scale,
    PieChart
} from 'lucide-react';
import { useNotificationCenter } from '@/context/NotificationContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const TABS = [
    { id: 'all', label: 'الكل', icon: Bell },
    { id: 'CRITICAL', label: 'عاجل', icon: Zap, color: 'text-rose-500' },
    { id: 'OPPORTUNITY', label: 'فرص', icon: TrendingUp, color: 'text-emerald-500' },
    { id: 'INSIGHT', label: 'رؤى', icon: PieChart, color: 'text-blue-500' },
];

const CATEGORY_STYLES = {
    CRITICAL: {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        text: 'text-rose-500',
        icon: Zap,
        glow: 'via-rose-500'
    },
    OPPORTUNITY: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-500',
        icon: TrendingUp,
        glow: 'via-emerald-500'
    },
    INSIGHT: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-500',
        icon: PieChart,
        glow: 'via-blue-500'
    },
    SYSTEM: {
        bg: 'bg-white/5',
        border: 'border-white/5',
        text: 'text-foreground/40',
        icon: Bell,
        glow: 'via-primary'
    }
};

export function SmartNotificationCenter() {
    const { isSidebarOpen, setIsSidebarOpen } = useNotificationCenter();
    const {
        notifications,
        markAsRead,
        deleteNotification,
        performAction,
        activeActionId
    } = useNotifications();

    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredNotifications = useMemo(() => {
        let result = notifications;

        if (activeTab !== 'all') {
            result = result.filter(n => n.category === activeTab);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(n =>
                n.title.toLowerCase().includes(query) ||
                n.message.toLowerCase().includes(query)
            );
        }

        return result;
    }, [notifications, activeTab, searchQuery]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Intelligence Summary
    const stats = useMemo(() => {
        return {
            critical: notifications.filter(n => n.category === 'CRITICAL' && !n.isRead).length,
            opportunity: notifications.filter(n => n.category === 'OPPORTUNITY' && !n.isRead).length
        };
    }, [notifications]);

    return (
        <AnimatePresence>
            {isSidebarOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-5xl h-[90vh] bg-background/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
                    >
                        {/* Header Area */}
                        <div className="p-8 md:p-10 border-b border-white/5 space-y-8 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                        <div className="relative p-4 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-2xl border border-white/20">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black tracking-tighter">AI Power Feed</h2>
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm text-foreground/40 font-bold uppercase tracking-[0.2em]">
                                                {unreadCount > 0 ? `${unreadCount} تنبيهات ذكية` : 'النظام يعمل بكفاءة'}
                                            </p>
                                            {stats.critical > 0 && (
                                                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-black border border-rose-500/20">
                                                    {stats.critical} حرجة
                                                </span>
                                            )}
                                            {stats.opportunity > 0 && (
                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black border border-emerald-500/20">
                                                    {stats.opportunity} فرصة
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="rounded-full h-12 w-12 hover:bg-white/10"
                                >
                                    <X size={24} />
                                </Button>
                            </div>

                            {/* Search and Tabs */}
                            <div className="flex flex-col lg:flex-row gap-6 items-end justify-between">
                                <div className="flex gap-2 p-1.5 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md">
                                    {TABS.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "relative flex items-center gap-2 px-6 py-3 rounded-[1.25rem] text-sm font-black transition-all duration-300",
                                                activeTab === tab.id
                                                    ? "bg-white text-black shadow-xl scale-105"
                                                    : "text-foreground/40 hover:text-foreground hover:bg-white/5"
                                            )}
                                        >
                                            <tab.icon size={16} className={cn(activeTab !== tab.id && tab.color)} />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <motion.div layoutId="tab-pill" className="absolute inset-0 bg-white rounded-[1.25rem] -z-10" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative w-full lg:w-96 group">
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 group-hover:text-primary transition-colors" size={18} />
                                    <Input
                                        placeholder="تصفية المحرك الذكي..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pr-12 h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary focus:border-primary transition-all backdrop-blur-md font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Feed Content */}
                        <ScrollArea className="flex-1 p-8 md:p-10 nc-scrollbar">
                            {filteredNotifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 gap-6 opacity-30">
                                    <div className="p-10 bg-white/5 rounded-full border border-white/5">
                                        <Search size={64} />
                                    </div>
                                    <p className="text-xl font-bold italic">لا توجد تنبيهات ذكية حالياً</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-5">
                                    <AnimatePresence mode="popLayout">
                                        {filteredNotifications.map((notif, idx) => (
                                            <SmartActionCard
                                                key={notif._id}
                                                notif={notif}
                                                onRead={() => markAsRead(notif._id)}
                                                onDelete={() => deleteNotification(notif._id)}
                                                onAction={() => performAction(notif._id)}
                                                isLoading={activeActionId === notif._id}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </ScrollArea>

                        {/* Footer Controls */}
                        <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3 text-foreground/30 text-[11px] font-black uppercase tracking-widest">
                                    <Zap size={14} className="text-primary animate-pulse" />
                                    Real-time Business Audit
                                </div>
                                <div className="h-4 w-[1px] bg-white/10" />
                                <div className="text-[10px] font-bold text-foreground/20">
                                    Last Sync: {new Date().toLocaleTimeString('ar-SA')}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    variant="ghost"
                                    className="h-12 px-6 text-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 font-black rounded-xl"
                                    onClick={() => deleteNotification('all')}
                                >
                                    <Trash2 size={16} className="ml-3" /> مسح الكل
                                </Button>
                                <Button
                                    className="h-12 px-10 bg-primary hover:bg-primary/90 text-white rounded-xl font-black shadow-lg shadow-primary/20"
                                    onClick={() => markAsRead('all')}
                                >
                                    أرشفة جميع التنبيهات
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function SmartActionCard({ notif, onRead, onDelete, onAction, isLoading }) {
    const isRead = notif.isRead;
    const style = CATEGORY_STYLES[notif.category] || CATEGORY_STYLES.SYSTEM;
    const Icon = style.icon;

    const getActionLabel = (type) => {
        switch (type) {
            case 'COLLECT_DEBT': return 'تحصيل الآن';
            case 'PAY_SUPPLIER': return 'سداد المورد';
            case 'REORDER': return 'إعادة طلب';
            case 'OPTIMIZE_PRICE': return 'تحسين السعر';
            case 'VIEW_REPORT': return 'عرض التقرير';
            default: return 'اتخاذ إجراء';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "group relative p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden backdrop-blur-2xl",
                !isRead
                    ? "bg-white/[0.03] border-white/10 hover:border-white/20 shadow-2xl"
                    : "opacity-40 grayscale pointer-events-none"
            )}
        >
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center relative z-10">
                {/* Visual Indicator */}
                <div className={cn(
                    "p-6 rounded-[2rem] border transition-all duration-500",
                    !isRead ? `${style.bg} ${style.border}` : "bg-white/5 border-white/5"
                )}>
                    <Icon className={cn("w-8 h-8", style.text)} />
                </div>

                {/* Text Content */}
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                            style.bg, style.border, style.text
                        )}>
                            {notif.category}
                        </span>
                        <h4 className="text-xl font-black tracking-tight">{notif.title}</h4>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold text-foreground/40">
                            <Clock size={12} />
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ar })}
                        </div>
                    </div>
                    <p className="text-base font-medium text-foreground/60 leading-relaxed max-w-3xl">
                        {notif.message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 w-full lg:w-auto shrink-0">
                    {notif.actionType && !isRead ? (
                        <Button
                            className={cn(
                                "flex-1 lg:flex-none h-16 px-10 rounded-2xl text-white font-black shadow-2xl transition-all hover:scale-[1.05]",
                                notif.category === 'CRITICAL' ? "bg-rose-600 hover:bg-rose-700" : "bg-primary hover:bg-primary/90"
                            )}
                            onClick={onAction}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : getActionLabel(notif.actionType)}
                            <ArrowRight className="mr-4" size={20} />
                        </Button>
                    ) : !isRead && (
                        <Button
                            variant="secondary"
                            className="h-16 px-10 rounded-2xl font-black bg-white/5 border border-white/5 hover:bg-white/10"
                            onClick={onRead}
                        >
                            أرشفة
                        </Button>
                    )}

                    <button
                        onClick={onDelete}
                        className="h-16 w-16 rounded-2xl bg-white/5 text-foreground/40 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/5"
                    >
                        <Trash2 size={24} />
                    </button>
                </div>
            </div>

            {/* Glowing active line */}
            {!isRead && (
                <div className={cn(
                    "absolute top-0 right-1/4 left-1/4 h-[2px] bg-gradient-to-r from-transparent to-transparent blur-md opacity-50",
                    style.glow
                )} />
            )}

            {/* Backdrop shimmer */}
            {!isRead && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            )}
        </motion.div>
    );
}

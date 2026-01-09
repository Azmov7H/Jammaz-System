'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Bell,
    Search,
    Trash2,
    ArrowRight,
    Loader2,
    Sparkles,
    TrendingUp,
    Zap,
    PieChart,
    AlertTriangle,
    Clock,
    Layout
} from 'lucide-react';
import { useNotificationCenter } from '@/context/NotificationContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const TABS = [
    { id: 'all', label: 'الكل', icon: Bell },
    { id: 'CRITICAL', label: 'عاجل', icon: Zap, color: 'text-rose-500' },
    { id: 'WARNING', label: 'تنبيهات', icon: AlertTriangle, color: 'text-amber-500' },
    { id: 'FINANCIAL', label: 'مالي', icon: Zap, color: 'text-emerald-500' },
    { id: 'OPPORTUNITY', label: 'فرص', icon: TrendingUp, color: 'text-emerald-500' },
    { id: 'INSIGHT', label: 'رؤى', icon: PieChart, color: 'text-blue-500' },
];

const CATEGORY_STYLES = {
    CRITICAL: {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        text: 'text-rose-500',
        icon: Zap,
        label: 'عاجل'
    },
    WARNING: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-500',
        icon: AlertTriangle,
        label: 'تنبيه'
    },
    OPPORTUNITY: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-500',
        icon: TrendingUp,
        label: 'فرصة'
    },
    INSIGHT: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-500',
        icon: PieChart,
        label: 'رؤية'
    },
    FINANCIAL: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-500',
        icon: TrendingUp,
        label: 'مالي'
    },
    SYSTEM: {
        bg: 'bg-muted/50',
        border: 'border-muted-foreground/10',
        text: 'text-muted-foreground',
        icon: Bell,
        label: 'نظام'
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
            result = result.filter(n => {
                const category = n.metadata?.category || n.category;
                if (activeTab === 'CRITICAL') return n.severity === 'critical' || category === 'CRITICAL';
                if (activeTab === 'WARNING') return n.severity === 'warning' || category === 'WARNING';
                return category === activeTab;
            });
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
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-5xl h-[85vh] md:h-[80vh] bg-card/90 backdrop-blur-3xl border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header Section */}
                        <div className="p-6 md:p-8 border-b border-white/5 space-y-6 bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                        <div className="relative w-12 h-12 bg-gradient-to-tr from-primary to-primary/60 rounded-xl flex items-center justify-center text-white shadow-xl rotate-2">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <h2 className="text-2xl font-black tracking-tight">مركز الذكاء</h2>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                {unreadCount > 0 ? `${unreadCount} تنبيهات نشطة` : 'جميع الأنظمة مستقرة'}
                                            </p>
                                            {unreadCount > 0 && (
                                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="rounded-full h-10 w-10 hover:bg-white/10"
                                >
                                    <X size={20} />
                                </Button>
                            </div>

                            {/* Search and Filters */}
                            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                                <div className="flex flex-wrap gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                                    {TABS.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300",
                                                activeTab === tab.id
                                                    ? "text-primary"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                            )}
                                        >
                                            {activeTab === tab.id && (
                                                <motion.div layoutId="tab-pill" className="absolute inset-0 bg-primary/10 rounded-lg -z-10 border border-primary/20" />
                                            )}
                                            <tab.icon size={14} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative w-full lg:w-72 group">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                    <Input
                                        placeholder="تصفية المحرك..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pr-10 h-10 bg-white/5 border-white/5 rounded-xl focus:ring-primary/30 text-xs font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-h-0">
                            <ScrollArea className="h-full">
                                <div className="p-6 md:p-8">
                                    <AnimatePresence mode="popLayout">
                                        {filteredNotifications.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="py-20 flex flex-col items-center justify-center gap-4 opacity-40 text-center"
                                            >
                                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5 text-muted-foreground">
                                                    <Layout size={32} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black">لا توجد سجلات</h3>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Feed is Clear</p>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {filteredNotifications.map((notif) => (
                                                    <SmartActionCard
                                                        key={notif._id}
                                                        notif={notif}
                                                        onRead={() => markAsRead(notif._id)}
                                                        onDelete={() => deleteNotification(notif._id)}
                                                        onAction={() => performAction(notif._id)}
                                                        isLoading={activeActionId === notif._id}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-8 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.3em]">
                                    <Zap size={14} className="animate-pulse" />
                                    Real-time Operational Insight
                                </div>
                                <div className="hidden sm:block h-4 w-[1px] bg-white/10" />
                                <div className="text-[10px] font-bold text-muted-foreground/40 hidden sm:block">
                                    SYNCHRONIZED WITH GLOBAL CLOUD
                                </div>
                            </div>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <Button
                                    variant="ghost"
                                    className="flex-1 sm:flex-none h-12 px-6 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 font-black rounded-xl transition-all"
                                    onClick={() => deleteNotification('all')}
                                >
                                    <Trash2 size={16} className="ml-3" /> مسح السجل
                                </Button>
                                <Button
                                    className="flex-1 sm:flex-none h-12 px-10 bg-primary hover:bg-primary/90 text-white rounded-xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
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
    const category = notif.metadata?.category || notif.category || 'SYSTEM';
    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.SYSTEM;
    const Icon = style.icon;

    const getActionLabel = (type) => {
        switch (type) {
            case 'COLLECT_DEBT': return 'تحصيل المبالغ';
            case 'PAY_SUPPLIER': return 'سداد الموردين';
            case 'REORDER': return 'إصدار أمر شراء';
            case 'OPTIMIZE_PRICE': return 'تعديل الأسعار';
            case 'VIEW_REPORT': return 'تحليل البيانات';
            default: return 'اتخاذ إجراء';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={cn(
                "group relative p-4 md:p-6 rounded-[1.5rem] border transition-all duration-300 overflow-hidden",
                !notif.isRead
                    ? "bg-white/[0.04] border-white/5 hover:border-white/10 shadow-lg backdrop-blur-xl"
                    : "opacity-40 grayscale pointer-events-none"
            )}
        >
            <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start lg:items-center relative z-10">
                {/* Visual Category */}
                <div className={cn(
                    "p-4 rounded-xl border transition-all shadow-md shrink-0",
                    style.bg, style.border, style.text
                )}>
                    <Icon className="w-6 h-6" />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className={cn("px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border transition-all", style.bg, style.border, style.text)}>
                            {style.label}
                        </Badge>
                        <h4 className="text-lg font-black tracking-tight">{notif.title}</h4>
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                            <Clock size={10} className="text-primary" />
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ar })}
                        </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-3xl line-clamp-2">
                        {notif.message}
                    </p>
                </div>

                {/* Actions Section */}
                <div className="flex gap-2 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
                    {notif.actionType && !notif.isRead ? (
                        <Button
                            className={cn(
                                "flex-1 lg:flex-none h-12 px-6 rounded-xl text-xs font-black shadow-lg transition-all hover:scale-[1.02] group/btn",
                                notif.category === 'CRITICAL' ? "bg-rose-600 hover:bg-rose-700" : "bg-primary hover:bg-primary/90"
                            )}
                            onClick={onAction}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : (
                                <>
                                    {getActionLabel(notif.actionType)}
                                    <ArrowRight className="mr-2 group-hover/btn:mr-1 group-hover/btn:ml-1 transition-all" size={16} />
                                </>
                            )}
                        </Button>
                    ) : !notif.isRead && (
                        <Button
                            variant="outline"
                            className="h-12 px-6 rounded-xl text-xs font-black bg-white/5 border-white/5 hover:bg-white/10 transition-all flex-1 lg:flex-none"
                            onClick={onRead}
                        >
                            أرشفة التنبيه
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        onClick={onDelete}
                        className="h-12 w-12 rounded-xl bg-white/5 text-muted-foreground flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5"
                    >
                        <Trash2 size={18} />
                    </Button>
                </div>
            </div>

            {/* Premium Decorative elements */}
            {!notif.isRead && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary rounded-l-full shadow-[0_0_15px_rgba(var(--primary),0.5)] opacity-50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
        </motion.div>
    );
}


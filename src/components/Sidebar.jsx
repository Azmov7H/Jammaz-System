'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Wallet,

    Users,
    History,
    Settings,
    Box,
    FileText,
    ClipboardCheck,
    BarChart2,
    Truck,
    TrendingUp,
    Plus,
    AlertCircle,
    DollarSign,
    ChevronRight,
    X,
    Sparkles
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission } from '@/lib/permissions';
import { useSidebar } from '@/providers/SidebarProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Menu configuration
const menuGroups = [
    {
        title: 'الرئيسية',
        items: [
            { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
            { name: 'استراتيجيات النمو', href: '/dashboard/strategy', icon: TrendingUp, permission: 'dashboard:view' },
        ]
    },
    {
        title: 'المخزون والمشتريات',
        items: [
            { name: 'المنتجات', href: '/products', icon: Package, permission: 'products:view' },
            { name: 'حركة المخزون', href: '/stock', icon: Box, permission: 'products:view' },
            { name: 'الجرد الفعلي', href: '/physical-inventory', icon: ClipboardCheck, permission: 'audit:manage' },
            { name: 'أوامر الشراء', href: '/purchase-orders', icon: ShoppingCart, permission: 'suppliers:manage' },
            { name: 'الموردين', href: '/suppliers', icon: Users, permission: 'suppliers:manage' },
            { name: 'تحليل المخزون', href: '/analytics/stock', icon: Truck, permission: 'reports:view' },
        ]
    },
    {
        title: 'المبيعات والمالية',
        items: [
            { name: 'فاتورة جديدة', href: '/invoices/new', icon: Plus, permission: 'invoices:create' },
            { name: 'سجل الفواتير', href: '/invoices', icon: FileText, permission: 'invoices:view' },
            { name: 'العملاء', href: '/customers', icon: Users, permission: 'invoices:view' },
            { name: 'ذمم العملاء', href: '/receivables', icon: Wallet, permission: 'invoices:view' },
            { name: 'نفقات التشغيل', href: '/financial/expenses', icon: DollarSign, permission: 'financial:view' },
            { name: 'الخزينة اليومية', href: '/cashbox-daily', icon: Wallet, permission: 'financial:view' },
            { name: 'المحاسبة العامة', href: '/accounting', icon: DollarSign, permission: 'financial:view' },
        ]
    },
    {
        title: 'التقارير',
        items: [
            { name: 'المبيعات اليومية', href: '/daily-sales', icon: BarChart2, permission: 'reports:view' },
            { name: 'ربحية العملاء', href: '/reports/profit-by-customer', icon: TrendingUp, permission: 'reports:view' },
            { name: 'تاريخ الأسعار', href: '/reports/price-history', icon: History, permission: 'reports:view' },
            { name: 'نواقص البضاعة', href: '/reports/shortage', icon: AlertCircle, permission: 'products:view' },
        ]
    },
    {
        title: 'النظام',
        items: [
            { name: 'سجل العمليات', href: '/logs', icon: History, permission: 'activity:view' },
            { name: 'المستخدمين', href: '/users', icon: Users, permission: 'users:manage' },
            { name: 'الإعدادات', href: '/settings', icon: Settings, permission: 'settings:manage' },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { role, user, loading } = useUserRole();
    const { isOpen, isMobile, closeSidebar } = useSidebar();
    const [expandedGroups, setExpandedGroups] = useState({
        'الرئيسية': true,
        'المخزون والمشتريات': true,
        'المبيعات والمالية': true,
        'النظام': true
    });

    // Check if user has permission for menu item
    const isAllowed = (item) => {
        if (loading || !role) return false;
        if (role === 'owner') return true;
        if (!item.permission) return true;
        return hasPermission(role, item.permission);
    };

    // Toggle group expansion
    const toggleGroup = (title) => {
        setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
    };

    // Get role display name
    const getRoleDisplay = () => {
        switch (role) {
            case 'owner': return 'المالك';
            case 'manager': return 'مدير فرع';
            case 'cashier': return 'كاشير';
            case 'warehouse': return 'أمين مستودع';
            default: return 'مستخدم';
        }
    };

    if (loading) {
        return (
            <aside className={cn(
                "glass-card border-l border-white/10 transition-all duration-300 backdrop-blur-xl",
                isMobile ? "fixed inset-y-0 right-0 z-50 w-72 shadow-2xl" : "w-72",
                !isOpen && "hidden"
            )}>
                <div className="animate-pulse h-full bg-gradient-to-b from-[#0f172a]/90 to-[#1e293b]/90" />
            </aside>
        );
    }

    return (
        <>
            {/* Mobile overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "glass-card border-l border-white/10 transition-all duration-300 flex flex-col backdrop-blur-xl bg-gradient-to-b from-[#0f172a]/95 via-[#1e293b]/95 to-[#0f172a]/95 shadow-2xl",
                isMobile ? "fixed inset-y-0 right-0 z-50 w-72" : "w-72",
                !isOpen && (isMobile ? "translate-x-full" : "hidden")
            )}>
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0 glass-card bg-gradient-to-l from-purple-500/10 via-blue-500/5 to-transparent relative overflow-hidden">
                    {/* Decorative gradient orbs */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl" />

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10">ج</span>
                            <Sparkles className="absolute top-1 left-1 h-3 w-3 text-white/40 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-base font-black bg-gradient-to-l from-purple-400 to-blue-400 bg-clip-text text-transparent">مخازن الجماز</h1>
                            <p className="text-[9px] text-foreground/50 font-medium tracking-wider">v2.1 SMART SYSTEM</p>
                        </div>
                    </div>
                    {isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={closeSidebar}
                            className="shrink-0 hover:bg-white/10 rounded-xl h-9 w-9 transition-all hover:scale-110 relative z-10"
                        >
                            <X size={18} />
                        </Button>
                    )}
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="px-3 space-y-6">
                        {menuGroups.map((group) => {
                            const allowedItems = group.items.filter(isAllowed);
                            if (allowedItems.length === 0) return null;

                            const isExpanded = expandedGroups[group.title];

                            return (
                                <div key={group.title} className="space-y-1">
                                    {/* Group header */}
                                    <button
                                        onClick={() => toggleGroup(group.title)}
                                        className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:text-foreground transition-all duration-300 rounded-xl hover:bg-white/5 group"
                                    >
                                        <span>{group.title}</span>
                                        <ChevronRight
                                            size={14}
                                            className={cn(
                                                "transition-all duration-300 group-hover:translate-x-[-2px]",
                                                isExpanded && "rotate-90"
                                            )}
                                        />
                                    </button>

                                    {/* Group items */}
                                    {isExpanded && (
                                        <div className="space-y-0.5">
                                            {allowedItems.map((item) => {
                                                const isActive = pathname === item.href ||
                                                    (pathname !== '/dashboard' && pathname.startsWith(item.href));
                                                const Icon = item.icon;

                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => isMobile && closeSidebar()}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                                            isActive
                                                                ? "glass-card bg-gradient-to-l from-purple-500/20 to-blue-500/10 text-foreground font-semibold shadow-lg border border-purple-500/20"
                                                                : "text-foreground/70 hover:bg-white/5 hover:text-foreground hover:translate-x-[-2px]"
                                                        )}
                                                    >
                                                        {/* Active indicator */}
                                                        {isActive && (
                                                            <>
                                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-l-full shadow-lg shadow-purple-500/50" />
                                                                <div className="absolute inset-0 bg-gradient-to-l from-purple-500/5 to-transparent animate-pulse" />
                                                            </>
                                                        )}

                                                        <Icon
                                                            size={18}
                                                            className={cn(
                                                                "shrink-0 relative z-10 transition-all duration-300",
                                                                isActive
                                                                    ? "text-purple-400 scale-110"
                                                                    : "text-foreground/50 group-hover:text-foreground group-hover:scale-110"
                                                            )}
                                                        />
                                                        <span className="text-sm relative z-10">{item.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </ScrollArea>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-white/10 shrink-0 glass-card bg-gradient-to-b from-purple-500/5 to-blue-500/5 relative overflow-hidden">
                    {/* Decorative gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="relative">
                            <Avatar className="h-11 w-11 border-2 border-purple-500/30 ring-2 ring-purple-500/10">
                                <AvatarImage src={user?.picture} alt={user?.name || 'User'} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold">
                                    {user?.name?.charAt(0) || 'م'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f172a] shadow-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-foreground">{user?.name || 'مستخدم'}</p>
                            <p className="text-xs text-foreground/60 truncate font-medium">{getRoleDisplay()}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

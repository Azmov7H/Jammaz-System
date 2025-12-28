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
    X
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
            { name: 'الجرد الفعلي', href: '/physical-inventory', icon: ClipboardCheck, permission: 'audit:manage' }, // NEW
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
            { name: 'ربحية العملاء', href: '/reports/profit-by-customer', icon: TrendingUp, permission: 'reports:view' }, // NEW
            { name: 'تاريخ الأسعار', href: '/reports/price-history', icon: History, permission: 'reports:view' }, // NEW
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
                "bg-sidebar border-l border-sidebar-border transition-all duration-300",
                isMobile ? "fixed inset-y-0 right-0 z-50 w-72 shadow-lg" : "w-72",
                !isOpen && "hidden"
            )}>
                <div className="animate-pulse h-full bg-sidebar" />
            </aside>
        );
    }

    return (
        <>
            {/* Mobile overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "bg-sidebar text-sidebar-foreground border-l border-sidebar-border transition-all duration-300 flex flex-col",
                isMobile ? "fixed inset-y-0 right-0 z-50 w-72 shadow-2xl" : "w-72",
                !isOpen && (isMobile ? "translate-x-full" : "hidden")
            )}>
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0 bg-gradient-to-l from-primary/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl shadow-colored animate-pulse-slow">
                            ج
                        </div>
                        <div>
                            <h1 className="text-lg font-bold animate-slide-in-right">مخازن الجماز</h1>
                            <p className="text-[10px] text-muted-foreground">v2.1 Smart System</p>
                        </div>
                    </div>
                    {isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={closeSidebar}
                            className="shrink-0 hover-scale hover:bg-primary/10"
                        >
                            <X size={20} />
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
                                        className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-300 rounded-md hover:bg-sidebar-accent/50 group"
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
                                        <div className="space-y-1">
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
                                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group relative overflow-hidden",
                                                            isActive
                                                                ? "gradient-primary text-primary-foreground font-medium shadow-colored hover-lift"
                                                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-[-2px]"
                                                        )}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute inset-0 bg-white/10 animate-shimmer" />
                                                        )}
                                                        <Icon
                                                            size={18}
                                                            className={cn(
                                                                "shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110",
                                                                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
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
                <div className="p-4 border-t border-sidebar-border shrink-0">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary">
                            <AvatarImage src={user?.picture} alt={user?.name || 'User'} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {user?.name?.charAt(0) || 'م'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || 'مستخدم'}</p>
                            <p className="text-xs text-muted-foreground truncate">{getRoleDisplay()}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

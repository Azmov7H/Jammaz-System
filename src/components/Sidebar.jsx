'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
    ShieldAlert,
    BarChart2,
    Truck,
    TrendingUp,
    Plus,
    AlertCircle,
    DollarSign,
    ChevronRight,
    X,
    Sparkles,
    LogOut
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission } from '@/lib/permissions';
import { useSidebar } from '@/providers/SidebarProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
        ]
    },
    {
        title: 'المبيعات والمالية',
        items: [
            { name: 'فاتورة جديدة', href: '/invoices/new', icon: Plus, permission: 'invoices:create' },
            { name: 'سجل الفواتير', href: '/invoices', icon: FileText, permission: 'invoices:view' },
            { name: 'العملاء', href: '/customers', icon: Users, permission: 'invoices:view' },
            { name: 'الخزينة والمالية', href: '/financial', icon: Wallet, permission: 'financial:view' },
            { name: 'مركز الديون والمستحقات', href: '/financial/debt-center', icon: ShieldAlert, permission: 'financial:view' },
            { name: 'المصروفات والإيرادات', href: '/accounting/manual', icon: TrendingUp, permission: 'financial:view' },
            { name: 'المحاسبة العامة', href: '/accounting', icon: DollarSign, permission: 'financial:view' },
        ]
    },
    {
        title: 'النظام',
        items: [
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
        'المبيعات والمالية': false,
        'النظام': false
    });

    const isAllowed = (item) => {
        if (loading || !role) return false;
        if (role === 'owner') return true;
        if (!item.permission) return true;
        return hasPermission(role, item.permission);
    };

    const toggleGroup = (title) => {
        setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const getRoleDisplay = () => {
        switch (role) {
            case 'owner': return 'المالك';
            case 'manager': return 'مدير فرع';
            case 'cashier': return 'كاشير';
            case 'warehouse': return 'أمين مستودع';
            default: return 'مستخدم';
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <>
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSidebar}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 transition-all"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={isMobile ? { x: '100%' } : false}
                animate={isMobile ? { x: isOpen ? 0 : '100%' } : { width: isOpen ? 288 : 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={cn(
                    "relative h-screen flex flex-col z-50 overflow-hidden shrink-0 w-72",
                    isMobile ? "fixed inset-y-0 right-0" : "sticky top-0",
                    "bg-background/40 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)]",
                    !isMobile && !isOpen && "border-none w-0"
                )}
            >
                {/* Logo Section */}
                <div className="h-20 flex items-center px-6 shrink-0 relative">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-tr from-primary via-primary/80 to-primary/40 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-12 transition-transform duration-500">
                                <Sparkles className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight text-foreground bg-gradient-to-l from-foreground via-foreground/80 to-foreground/50 bg-clip-text text-transparent">
                                مخازن الجماز
                            </span>
                            <span className="text-[10px] font-bold text-primary/60 tracking-widest uppercase">
                                v2.5 Evolution
                            </span>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 px-4 py-2">
                    {/* Premium Sidebar Scrollbar */}
                    <style jsx global>{`
                        .sidebar-scroll .absolute[data-orientation="vertical"] {
                            right: 2px !important;
                            width: 6px !important;
                            background: transparent !important;
                        }
                        .sidebar-scroll .absolute[data-orientation="vertical"] > div {
                            background: linear-gradient(to bottom, #3b82f6, #8b5cf6) !important;
                            border-radius: 10px !important;
                            opacity: 0.5;
                            transition: opacity 0.3s;
                        }
                        .sidebar-scroll:hover .absolute[data-orientation="vertical"] > div {
                            opacity: 1;
                        }
                    `}</style>
                    <div className="space-y-6 sidebar-scroll">
                        {menuGroups.map((group, groupIdx) => {
                            const allowedItems = group.items.filter(isAllowed);
                            if (allowedItems.length === 0) return null;
                            const isExpanded = expandedGroups[group.title];

                            return (
                                <div key={group.title} className="space-y-2">
                                    <button
                                        onClick={() => toggleGroup(group.title)}
                                        className="flex items-center justify-between w-full px-3 py-2 group hover:bg-white/5 rounded-xl transition-colors"
                                    >
                                        <span className="text-[11px] font-black text-muted-foreground group-hover:text-foreground tracking-widest uppercase transition-colors">
                                            {group.title}
                                        </span>
                                        <ChevronRight
                                            size={14}
                                            className={cn(
                                                "text-muted-foreground transition-transform duration-300",
                                                isExpanded && "rotate-90 text-primary"
                                            )}
                                        />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'circOut' }}
                                                className="overflow-hidden space-y-1"
                                            >
                                                {allowedItems.map((item, itemIdx) => {
                                                    const isActive = pathname === item.href || (pathname !== '/dashboard' && pathname.startsWith(item.href));
                                                    const Icon = item.icon;

                                                    return (
                                                        <Link key={item.href} href={item.href} onClick={() => isMobile && closeSidebar()}>
                                                            <motion.div
                                                                whileHover={{ x: -4 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                className={cn(
                                                                    "group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                                                                    isActive
                                                                        ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)] border border-primary/20"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                                                )}
                                                            >
                                                                {isActive && (
                                                                    <motion.div
                                                                        layoutId="active-nav"
                                                                        className="absolute right-0 top-3 bottom-3 w-1.5 bg-primary rounded-l-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                                                                    />
                                                                )}
                                                                <Icon
                                                                    size={20}
                                                                    className={cn(
                                                                        "transition-all duration-300",
                                                                        isActive ? "text-primary scale-110" : "group-hover:scale-110"
                                                                    )}
                                                                />
                                                                <span className="text-sm font-bold tracking-tight">{item.name}</span>

                                                                {isActive && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        className="absolute left-3 w-1.5 h-1.5 rounded-full bg-primary"
                                                                    />
                                                                )}
                                                            </motion.div>
                                                        </Link>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                {/* Footer Section */}
                <div className="p-4 mt-auto">
                    <div className="p-4 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-primary/20 ring-4 ring-primary/5 transition-transform duration-500 group-hover:scale-110">
                                    <AvatarImage src={user?.picture} />
                                    <AvatarFallback className="bg-primary text-white font-black text-lg">
                                        {user?.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-[#1e293b] shadow-lg animate-pulse" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">
                                    {user?.name}
                                </p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {getRoleDisplay()}
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="h-10 w-10 rounded-2xl hover:bg-destructive/10 hover:text-destructive group-hover:scale-110 transition-all"
                            >
                                <LogOut size={18} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Background Decorative Blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            </motion.aside>
        </>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
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
    ChevronDown,
    ChevronRight,
    AlertCircle,
    DollarSign
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserRole } from '@/hooks/useUserRole';
import { PERMISSIONS } from '@/lib/permissions';

import { hasPermission } from '@/lib/permissions';

// Menu Groups Configuration
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
            { name: 'أوامر الشراء', href: '/purchase-orders', icon: ShoppingCart, permission: 'suppliers:manage' }, // Assuming PO is for managers/warehouse
            { name: 'الموردين', href: '/suppliers', icon: Users, permission: 'suppliers:manage' },
            { name: 'الجرد المخزني', href: '/audit', icon: ClipboardCheck, permission: 'audit:manage' },
            { name: 'تحليل المخزون', href: '/analytics/stock', icon: Truck, permission: 'reports:view' },
        ]
    },
    {
        title: 'المبيعات والمالية',
        items: [
            { name: 'فاتورة جديدة', href: '/invoices/new', icon: Plus, permission: 'invoices:create' },
            { name: 'سجل الفواتير', href: '/invoices', icon: FileText, permission: 'invoices:view' },
            { name: 'الخزينة / المالية', href: '/financial', icon: DollarSign, permission: 'financial:view' },
            { name: 'تقارير المبيعات', href: '/reports/sales', icon: BarChart2, permission: 'reports:view' },
            { name: 'نواقص البضاعة', href: '/reports/shortage', icon: AlertCircle, permission: 'products:view' },
        ]
    },
    {
        title: 'النظام',
        items: [
            { name: 'سجل العمليات', href: '/logs', icon: History, permission: 'activity:view' }, // Need this perm
            { name: 'المستخدمين', href: '/users', icon: Users, permission: 'users:manage' }, // Need this perm
            { name: 'الإعدادات', href: '/settings', icon: Settings, permission: 'settings:manage' }, // Need this perm
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { role, user, loading } = useUserRole();
    const [openGroups, setOpenGroups] = useState({ 'الرئيسية': true, 'المخزون والمشتريات': true, 'المبيعات والمالية': true, 'النظام': true });

    // Toggle Group
    const toggleGroup = (title) => {
        setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
    };

    // Filter Logic
    const isAllowed = (item) => {
        if (loading || !role) return false;
        if (role === 'owner') return true;
        // If no permission specified on item, assume public/allowed? Better to be strict: required.
        if (!item.permission) return true;
        return hasPermission(role, item.permission);
    };

    if (loading) return <aside className="w-72 bg-primary/80 backdrop-blur-xl min-h-screen animate-pulse"></aside>;

    return (
        <aside className="w-72 bg-[#1B3C73] text-white min-h-screen flex flex-col shadow-2xl z-20 border-r border-[#1B3C73] transition-colors duration-300">
            {/* Header */}
            <div className="h-20 flex items-center justify-center border-b border-primary-foreground/20 bg-primary/95 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-bold text-xl shadow-lg">
                        ج
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-primary-foreground tracking-wide">مخازن الجماز</h1>
                        <p className="text-[10px] text-primary-foreground/70 opacity-80">v2.1 Smart System</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
                {menuGroups.map((group) => {
                    // Check if group has any allowed items
                    const allowedItems = group.items.filter(item => isAllowed(item));
                    if (allowedItems.length === 0) return null;

                    const isOpen = openGroups[group.title];

                    return (
                        <div key={group.title} className="space-y-1">
                            <button
                                onClick={() => toggleGroup(group.title)}
                                className="flex items-center justify-between w-full px-2 text-primary-foreground/50 hover:text-white mb-2 text-xs font-bold uppercase tracking-wider group"
                            >
                                <span>{group.title}</span>
                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-1 overflow-hidden"
                                    >
                                        {allowedItems.map((item) => {
                                            const isActive = pathname === item.href || (pathname !== '/dashboard' && pathname.startsWith(item.href));
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={clsx(
                                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                                        isActive
                                                            ? "bg-secondary text-secondary-foreground font-bold shadow-lg transform scale-[1.02]"
                                                            : "text-primary-foreground/80 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={clsx(isActive ? "text-secondary-foreground" : "text-primary-foreground/60 group-hover:text-white")} />
                                                    <span className="text-sm">{item.name}</span>
                                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md opacity-20"></div>}
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

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-primary-foreground/20 bg-primary/95 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary to-yellow-200 p-0.5">
                        <img src={user?.picture || "https://ui-avatars.com/api/?name=User&background=random"} className="rounded-full w-full h-full" alt="User" />
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-bold text-primary-foreground truncate">{user?.name || 'مستخدم'}</p>
                        <p className="text-xs text-primary-foreground/70 truncate">{
                            role === 'owner' ? 'المالك' :
                                role === 'manager' ? 'مدير فرع' :
                                    role === 'cashier' ? 'كاشير' : 'أمين مستودع'
                        }</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="p-2 hover:bg-white/10 rounded-full" title="تحديث النظام / حذف الكاش">
                        <History size={16} className="text-white/50 hover:text-white" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

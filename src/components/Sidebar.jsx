'use client';

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
    Plus
} from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
    { name: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
    { name: 'استراتيجيات النمو', href: '/dashboard/strategy', icon: TrendingUp },
    { name: 'المنتجات', href: '/products', icon: Package },
    { name: 'حركة المخزون', href: '/stock', icon: Box },
    { name: 'الفواتير', href: '/invoices', icon: FileText },
    { name: 'فاتورة جديدة', href: '/invoices/new', icon: Plus },
    { name: 'أوامر الشراء', href: '/purchase-orders', icon: ShoppingCart },
    { name: 'الموردين', href: '/suppliers', icon: Users },
    { name: 'تقارير المبيعات', href: '/reports/sales', icon: BarChart2 },
    { name: 'تحليل المخزون', href: '/analytics/stock', icon: Truck }, // Using Truck for logistics/analytics context
    { name: 'الجرد المخزني', href: '/audit', icon: ClipboardCheck },
    { name: 'الخزينة / المالية', href: '/financial', icon: Users }, // Using Users temporarily or better icon
    { name: 'سجل العمليات', href: '/logs', icon: History },
    { name: 'الإعدادات', href: '/settings', icon: Settings },
];

import { useUserRole, PERMISSIONS } from '@/hooks/useUserRole';

export default function Sidebar() {
    const pathname = usePathname();
    const { role, user, loading } = useUserRole();

    // Filter menu items based on role
    const filteredMenuItems = menuItems.filter(item => {
        if (loading || !role) return false; // Hide while loading or if not logged in
        if (role === 'owner') return true; // Owner sees everything

        const allowedRoutes = PERMISSIONS[role] || [];
        return allowedRoutes.includes(item.href);
    });

    if (loading) return <aside className="w-72 bg-primary min-h-screen animate-pulse"></aside>;

    return (
        <aside className="w-72 bg-primary text-primary-foreground min-h-screen flex flex-col shadow-2xl z-20 transition-colors duration-300">
            <div className="h-20 flex items-center justify-center border-b border-primary-foreground/20 bg-primary/95 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-bold text-xl shadow-lg">
                        ج
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-primary-foreground tracking-wide">مخازن الجماز</h1>
                        <p className="text-[10px] text-primary-foreground/70 opacity-80">أنظمة إدارة المخزون v2.0</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                {filteredMenuItems.map((item) => {
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
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={clsx(isActive ? "text-secondary-foreground" : "text-primary-foreground/60 group-hover:text-white")} />
                            <span className="text-sm">{item.name}</span>
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md opacity-20"></div>}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-primary-foreground/20 bg-primary/95">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary to-yellow-200 p-0.5">
                        <img src={user?.picture || "https://ui-avatars.com/api/?name=User&background=random"} className="rounded-full w-full h-full" alt="User" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-primary-foreground">{user?.name || 'مستخدم'}</p>
                        <p className="text-xs text-primary-foreground/70">{
                            role === 'owner' ? 'المالك' :
                                role === 'manager' ? 'مدير فرع' :
                                    role === 'cashier' ? 'كاشير' : 'أمين مستودع'
                        }</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

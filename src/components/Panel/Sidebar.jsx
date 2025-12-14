'use client';

import { useState } from 'react';
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
  DollarSign,
  LogOut,
  Landmark
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
      { name: 'الموردين', href: '/suppliers', icon: Users, permission: 'suppliers:manage' },
      { name: 'أوامر الشراء', href: '/purchase-orders', icon: ShoppingCart, permission: 'suppliers:manage' },
      { name: 'الجرد المخزني', href: '/audit', icon: ClipboardCheck, permission: 'audit:manage' },
      { name: 'تحليل المخزون', href: '/analytics/stock', icon: Truck, permission: 'reports:view' },
    ]
  },
  {
    title: 'المبيعات والمالية',
    items: [
      { name: 'فاتورة جديدة', href: '/invoices/new', icon: Plus, permission: 'invoices:create' },
      { name: 'سجل الفواتير', href: '/invoices', icon: FileText, permission: 'invoices:view' },
      { name: 'الخزينة والمالية', href: '/financial', icon: Landmark, permission: 'financial:view' },
      { name: 'تقارير المبيعات', href: '/reports/sales', icon: BarChart2, permission: 'reports:view' },
      { name: 'نواقص البضاعة', href: '/reports/shortage', icon: AlertCircle, permission: 'products:view' },
    ]
  },
  {
    title: 'النظام',
    items: [
      { name: 'العملاء', href: '/customers', icon: Users, permission: 'invoices:create' },
      { name: 'سجل العمليات', href: '/logs', icon: History, permission: 'activity:view' },
      { name: 'المستخدمين', href: '/users', icon: Users, permission: 'users:manage' },
      { name: 'الإعدادات', href: '/settings', icon: Settings, permission: 'settings:manage' },
    ]
  }
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { role, user, loading } = useUserRole();
  const [openGroups, setOpenGroups] = useState({ 'الرئيسية': true, 'المخزون والمشتريات': true, 'المبيعات والمالية': true, 'النظام': true });

  // Toggle Group
  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Filter Logic
  const isAllowed = (item) => {
    if (loading) return false;
    if (role === 'owner') return true;
    if (!item.permission) return true;
    // Basic permission check (can be enhanced)
    return hasPermission(role, item.permission);
  };

  if (loading) return <aside className="w-72 bg-white/50 backdrop-blur-xl h-screen animate-pulse border-l"></aside>;

  return (
    <aside className="w-72 bg-[#1B3C73] text-white h-screen flex flex-col shadow-2xl z-40 border-l border-[#2c4e8a] transition-all duration-300 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Header */}
      <div className="h-24 flex flex-col items-center justify-center border-b border-white/10 bg-[#153060] shrink-0 relative z-10 gap-1 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-[#1B3C73] font-black text-2xl shadow-lg transform rotate-3">
            J
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide font-sans">EL-Jammaz</h1>
            <p className="text-[10px] text-yellow-400 font-medium tracking-widest uppercase">Stock Manager</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar relative z-10" dir="rtl">
        {menuGroups.map((group) => {
          const allowedItems = group.items.filter(item => isAllowed(item));
          if (allowedItems.length === 0) return null;

          const isOpen = openGroups[group.title];

          return (
            <div key={group.title} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex items-center justify-between w-full px-2 text-white/50 hover:text-white mb-2 text-xs font-bold uppercase tracking-wider group transition-colors"
              >
                <span>{group.title}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} className="rtl:rotate-180" />}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1 overflow-hidden"
                  >
                    {allowedItems.map((item) => {
                      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                            isActive
                              ? "bg-white text-[#1B3C73] font-bold shadow-lg translate-x-[-4px]"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <item.icon size={20} className={clsx("shrink-0", isActive ? "text-[#1B3C73]" : "text-white/60 group-hover:text-white")} />
                          <span className="text-sm">{item.name}</span>
                          {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1B3C73] rounded-l-full"></div>}
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
      <div className="p-4 border-t border-white/10 bg-[#153060] shrink-0 relative z-10" dir="rtl">
        <div className="flex items-center gap-3 bg-[#0f244a] p-3 rounded-xl border border-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 p-0.5 shrink-0">
            <img
              src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
              className="rounded-full w-full h-full object-cover border-2 border-[#153060]"
              alt="User"
            />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'المستخدم'}</p>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${role === 'owner' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
              <p className="text-[10px] text-white/60 truncate capitalize">{role || 'Employee'}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/login'}
            className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors group"
            title="تسجيل الخروج"
          >
            <LogOut size={18} className="text-white/40 group-hover:text-red-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}

import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Wallet,
    Users,
    Settings,
    Box,
    FileText,
    ClipboardCheck,
    ShieldAlert,
    TrendingUp,
    Plus,
    DollarSign,
    RotateCcw
} from 'lucide-react';

export const navigationConfig = [
    {
        title: 'الرئيسية',
        items: [
            { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard, permission: 'dashboard:view' },
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
            { name: 'مرتجع المبيعات', href: '/sales-returns', icon: RotateCcw, permission: 'invoices:view' },
            { name: 'العملاء', href: '/customers', icon: Users, permission: 'invoices:view' },
            { name: 'الخزينة والمالية', href: '/financial', icon: Wallet, permission: 'financial:view' },
            { name: 'مركز الديون والمستحقات', href: '/financial/debt-center', icon: ShieldAlert, permission: 'financial:view' },

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

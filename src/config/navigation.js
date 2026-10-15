import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Wallet,
    Contact,
    Settings,
    Boxes,
    ArrowLeftRight,
    FileText,
    ClipboardCheck,
    ShieldAlert,
    Plus,
    Truck,
    UserCog,
    RotateCcw,
    ChartColumnBig,
    ChartPie,
    TrendingUp,
    History,
    PackageX,
    Link2,
    Warehouse
} from 'lucide-react';

/**
 * Sidebar navigation config (UX-010).
 * Rules enforced by src/config/navigation.test.js:
 *  - unique href per item, unique icon per destination, explicit permission per item.
 */
export const navigationConfig = [
    {
        title: 'الرئيسية',
        items: [
            { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard, permission: 'dashboard:view' },
        ]
    },
    {
        title: 'المبيعات',
        items: [
            { name: 'فاتورة جديدة', href: '/invoices/new', icon: Plus, permission: 'invoices:create' },
            { name: 'سجل الفواتير', href: '/invoices', icon: FileText, permission: 'invoices:view' },
            { name: 'مرتجع المبيعات', href: '/sales-returns', icon: RotateCcw, permission: 'invoices:view' },
            { name: 'العملاء', href: '/customers', icon: Contact, permission: 'invoices:view' },
        ]
    },
    {
        title: 'المخزون والمشتريات',
        items: [
            { name: 'المنتجات', href: '/products', icon: Package, permission: 'products:view' },
            { name: 'المخازن', href: '/warehouses', icon: Warehouse, permission: 'warehouses:view' },
            { name: 'المخزون الحالي', href: '/stock', icon: Boxes, permission: 'products:view' },
            { name: 'سجل حركة المخزون', href: '/stock-movements', icon: ArrowLeftRight, permission: 'products:view' },
            { name: 'الجرد الفعلي', href: '/physical-inventory', icon: ClipboardCheck, permission: 'audit:manage' },
            { name: 'أوامر الشراء', href: '/purchase-orders', icon: ShoppingCart, permission: 'suppliers:manage' },
            { name: 'الموردين', href: '/suppliers', icon: Truck, permission: 'suppliers:manage' },
        ]
    },
    {
        title: 'المالية',
        items: [
            { name: 'الخزينة والحركات', href: '/financial', icon: Wallet, permission: 'financial:view' },
            { name: 'مركز الديون والمستحقات', href: '/financial/debt-center', icon: ShieldAlert, permission: 'financial:view' },
            { name: 'الأطراف / التحقق من التكرار', href: '/parties', icon: Link2, permission: 'parties:manage' },
        ]
    },
    {
        title: 'التقارير',
        items: [
            { name: 'التقارير المالية', href: '/reports/financial', icon: ChartPie, permission: 'reports:view' },
            { name: 'تقرير المبيعات', href: '/reports/sales', icon: ChartColumnBig, permission: 'reports:view' },
            { name: 'أرباح العملاء', href: '/reports/profit-by-customer', icon: TrendingUp, permission: 'reports:view' },
            { name: 'تاريخ الأسعار', href: '/reports/price-history', icon: History, permission: 'reports:view' },
            { name: 'النواقص', href: '/reports/shortage', icon: PackageX, permission: 'reports:view' },
        ]
    },
    {
        title: 'النظام',
        items: [
            { name: 'المستخدمين', href: '/users', icon: UserCog, permission: 'users:manage' },
            { name: 'الإعدادات', href: '/settings', icon: Settings, permission: 'settings:manage' },
        ]
    }
];

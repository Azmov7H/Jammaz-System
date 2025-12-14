'use client';

import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    Package,
    AlertTriangle,
    DollarSign,
    Wallet,
    ShoppingCart,
    Loader2,
    TrendingDown,
    FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    // Fetch real KPIs from API
    const { data, isLoading, error } = useQuery({
        queryKey: ['dashboard-kpis'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/kpis');
            if (!res.ok) throw new Error('Failed to fetch KPIs');
            return res.json();
        },
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-semibold text-foreground mb-2">حدث خطأ في تحميل البيانات</h3>
                <p className="text-muted-foreground">يرجى المحاولة مرة أخرى</p>
            </div>
        );
    }

    const { kpis, monthSummary, recentActivity, lowStockProducts } = data;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">لوحة التحكم</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        نظرة شاملة على أداء المخزون والمبيعات
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/invoices/new">
                        <Button className="gap-2 shadow-sm">
                            <ShoppingCart className="h-4 w-4" />
                            <span className="hidden sm:inline">فاتورة جديدة</span>
                            <span className="sm:hidden">جديد</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* 1. Sales */}
                <KPICard
                    title="مبيعات اليوم"
                    value={kpis.todaySales.toLocaleString()}
                    unit=" ج.م"
                    icon={DollarSign}
                    subtitle={`${kpis.todayInvoices} فاتورة`}
                    variant="primary"
                />

                {/* 2. Receivables (Money IN pending) */}
                <KPICard
                    title="ذمم العملاء (لنا)"
                    value={kpis.totalReceivables.toLocaleString()}
                    unit=" ج.م"
                    icon={TrendingUp} // Or Users
                    subtitle="ديون مستحقة"
                    variant="warning"
                />

                {/* 3. Payables (Money OUT pending) */}
                <KPICard
                    title="مستحقات الموردين (علينا)"
                    value={kpis.totalPayables.toLocaleString()}
                    unit=" ج.م"
                    icon={TrendingDown}
                    subtitle="التزامات"
                    variant="destructive"
                />

                {/* 4. Cash */}
                <KPICard
                    title="رصيد الخزينة"
                    value={kpis.cashBalance.toLocaleString()}
                    unit=" ج.م"
                    icon={Wallet}
                    subtitle="سيولة متاحة"
                    variant="success"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <KPICard
                    title="الربح اليوم"
                    value={kpis.todayProfit.toLocaleString()}
                    unit=" ج.م"
                    icon={TrendingUp}
                    variant="secondary"
                />
                <KPICard
                    title="قيمة المخزون"
                    value={kpis.totalStockValue.toLocaleString()}
                    unit=" ج.م"
                    icon={Package}
                    subtitle="سعر الشراء"
                    variant="default"
                />
                <KPICard
                    title="طلبات شراء معلقة"
                    value={kpis.pendingPOs}
                    unit=" طلب"
                    icon={ShoppingCart}
                    variant="default"
                />
                <KPICard
                    title="نواقص المخزون"
                    value={kpis.lowStockCount + kpis.outOfStockCount}
                    unit=" منتج"
                    icon={AlertTriangle}
                    variant="destructive"
                />
            </div>

            {/* Month Summary */}
            <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground">ملخص الشهر</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">إجمالي المبيعات</p>
                                    <p className="text-2xl font-bold text-foreground">{monthSummary.totalRevenue.toLocaleString()} ج.م</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">إجمالي الأرباح</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{monthSummary.totalProfit.toLocaleString()} ج.م</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">عدد الفواتير</p>
                                    <p className="text-2xl font-bold text-foreground">{monthSummary.totalInvoices}</p>
                                </div>
                                <FileText className="w-8 h-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Alerts & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Alerts */}
                <Card className="border shadow-sm">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle size={20} />
                            تنبيهات المخزون
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <span className="text-sm font-medium">منتجات منخفضة</span>
                                <Badge variant="warning">{kpis.lowStockCount}</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                <span className="text-sm font-medium">منتجات نفذت</span>
                                <Badge variant="destructive">{kpis.outOfStockCount}</Badge>
                            </div>
                            {kpis.pendingPOs > 0 && (
                                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <span className="text-sm font-medium">أوامر شراء معلقة</span>
                                    <Badge variant="secondary">{kpis.pendingPOs}</Badge>
                                </div>
                            )}
                            <Link href="/stock">
                                <Button variant="outline" className="w-full mt-2">عرض المخزون</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Invoices */}
                <Card className="border shadow-sm">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center justify-between">
                            <span>آخر الفواتير</span>
                            <Link href="/invoices">
                                <Button variant="ghost" size="sm">عرض الكل</Button>
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            {recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">لا توجد فواتير</p>
                            ) : (
                                recentActivity.map((invoice) => (
                                    <Link key={invoice._id} href={`/invoices/${invoice._id}`}>
                                        <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg border transition-colors cursor-pointer">
                                            <div>
                                                <p className="font-mono text-sm font-semibold">{invoice.number}</p>
                                                <p className="text-xs text-muted-foreground">{invoice.customerName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">{invoice.total.toLocaleString()} ج.م</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(invoice.date).toLocaleDateString('ar-SA')}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Products */}
            {lowStockProducts.length > 0 && (
                <Card className="border shadow-sm">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <TrendingDown size={20} />
                            منتجات تحتاج إعادة طلب
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">المنتج</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">المحل</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">المخزن</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">الإجمالي</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">الحد الأدنى</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {lowStockProducts.map((product) => (
                                        <tr key={product._id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{product.code}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">{product.shopQty}</td>
                                            <td className="px-4 py-3 text-center">{product.warehouseQty}</td>
                                            <td className="px-4 py-3 text-center font-bold text-destructive">{product.stockQty}</td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{product.minLevel}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// KPI Card Component
function KPICard({ title, value, unit, icon: Icon, subtitle, variant = 'default' }) {
    const variants = {
        primary: 'border-primary/20 bg-primary/5',
        success: 'border-green-500/20 bg-green-500/5',
        warning: 'border-amber-500/20 bg-amber-500/5',
        destructive: 'border-red-500/20 bg-red-500/5',
        secondary: 'border-secondary/20 bg-secondary/5',
        default: 'border-border bg-card'
    };

    const iconColors = {
        primary: 'text-primary',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-amber-600 dark:text-amber-400',
        destructive: 'text-red-600 dark:text-red-400',
        secondary: 'text-secondary',
        default: 'text-muted-foreground'
    };

    return (
        <Card className={cn('border shadow-sm', variants[variant])}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <Icon className={cn('w-5 h-5', iconColors[variant])} />
                </div>
                <div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">
                        {value}
                        <span className="text-lg">{unit}</span>
                    </p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

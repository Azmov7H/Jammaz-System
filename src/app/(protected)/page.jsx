'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    TrendingUp, DollarSign, Package,
    AlertTriangle, ShoppingCart, Users,
    Clock, ArrowUpRight, Wallet, Activity,
    Box, FileText, ArrowDownRight, RefreshCcw
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function DashboardPage() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['dashboard-kpis'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/kpis');
            const json = await res.json();
            return json.data;
        }
    });

    if (isLoading) return <DashboardSkeleton />;

    const { kpis, monthSummary, recentActivity, lowStockProducts } = data;

    return (
        <div className="space-y-8 animate-fade-in-up" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <Activity className="text-primary w-8 h-8" />
                        لوحة التحكم
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">نظرة عامة على أداء المتجر والعمليات الحالية</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold gap-2"
                    onClick={() => refetch()}
                >
                    <RefreshCcw className="w-4 h-4" />
                    تحديث البيانات
                </Button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="مبيعات اليوم"
                    value={kpis.todaySales.toLocaleString()}
                    unit=" ج.م"
                    icon={DollarSign}
                    variant="primary"
                    subtitle={`${kpis.todayInvoices} فاتورة اليوم`}
                />
                <KPICard
                    title="صافي ربح اليوم"
                    value={kpis.todayProfit.toLocaleString()}
                    unit=" ج.م"
                    icon={TrendingUp}
                    variant="success"
                    subtitle="بعد خصم المصروفات"
                />
                <KPICard
                    title="رصيد الخزينة"
                    value={kpis.cashBalance.toLocaleString()}
                    unit=" ج.م"
                    icon={Wallet}
                    variant="warning"
                />
                <KPICard
                    title="قيمة المخزون"
                    value={kpis.totalStockValue.toLocaleString()}
                    unit=" ج.م"
                    icon={Box}
                    variant="secondary"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Activity & Month Summary */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Month Summary Card */}
                    <Card className="overflow-hidden border-none shadow-custom-xl bg-gradient-to-br from-card via-card to-primary/5">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl font-black">ملخص الشهر الحالي</CardTitle>
                            <Badge variant="secondary" className="font-bold">{format(new Date(), 'MMMM yyyy', { locale: ar })}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">إجمالي الإيرادات</p>
                                    <p className="text-2xl font-black">{monthSummary.totalRevenue.toLocaleString()} ج.م</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">إجمالي الأرباح</p>
                                    <p className="text-2xl font-black text-emerald-500">{monthSummary.totalProfit.toLocaleString()} ج.م</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">إجمالي المصروفات</p>
                                    <p className="text-2xl font-black text-rose-500">{monthSummary.totalExpenses.toLocaleString()} ج.م</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Invoices Table */}
                    <Card className="border-none shadow-custom-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-black">آخر الفواتير</CardTitle>
                            <Button variant="link" className="text-primary font-bold">عرض الكل</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.map((invoice, i) => (
                                    <motion.div
                                        key={invoice._id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">فاتورة #{invoice.number}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{invoice.customerName || 'عميل نقدي'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg">{invoice.total.toLocaleString()} ج.م</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase">{format(new Date(invoice.date), 'hh:mm a')}</p>
                                        </div>
                                    </motion.div>
                                ))}
                                {recentActivity.length === 0 && (
                                    <div className="text-center py-10 opacity-50">لا توجد مبيعات مؤخراً</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Inventory Alerts & Fast Stats */}
                <div className="space-y-8">
                    {/* Inventory Alerts */}
                    <Card className="border-none shadow-custom-xl border-t-4 border-amber-500">
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <AlertTriangle className="text-amber-500 w-5 h-5" />
                                تنبيهات المخزون
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {lowStockProducts.map((product) => (
                                <div key={product._id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[120px]">{product.name}</p>
                                            <p className="text-[10px] text-amber-600 font-bold">المتبقي: {product.stockQty}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold border-amber-500/20 hover:bg-amber-500/10 text-amber-700">طلب توريد</Button>
                                </div>
                            ))}
                            {lowStockProducts.length === 0 && (
                                <div className="text-center py-6 text-sm font-medium text-emerald-500">مخزونك في حالة ممتازة! ✨</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Stats Sidebar */}
                    <Card className="border-none shadow-custom-xl bg-primary text-primary-foreground overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                        <CardHeader>
                            <CardTitle className="text-xl font-black">إحصائيات سريعة</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg"><Users className="w-4 h-4" /></div>
                                    <span className="text-sm font-bold">المديونات</span>
                                </div>
                                <span className="text-lg font-black">{kpis.totalReceivables.toLocaleString()} ج.م</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg"><ShoppingCart className="w-4 h-4" /></div>
                                    <span className="text-sm font-bold">طلبات الشراء</span>
                                </div>
                                <span className="text-lg font-black">{kpis.pendingPOs} طلب</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-6 animate-pulse" dir="rtl">
            <div className="h-10 w-48 bg-muted rounded-xl mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-3xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-48 bg-muted rounded-3xl" />
                    <div className="h-96 bg-muted rounded-3xl" />
                </div>
                <div className="h-96 bg-muted rounded-3xl" />
            </div>
        </div>
    );
}

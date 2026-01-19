'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { motion } from 'framer-motion';
import {
    TrendingUp, DollarSign, Package,
    AlertTriangle, ShoppingCart, Users,
    Clock, ArrowUpRight, Wallet, Activity,
    Box, FileText, ArrowDownRight, RefreshCcw,
    LayoutGrid, Zap, PieChart
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function DashboardPage() {
    const {
        kpis,
        monthSummary,
        recentActivity,
        lowStockProducts,
        stats,
        chartData,
        topSelling,
        strategy,
        isLoading,
        refetch
    } = useDashboard();

    if (isLoading) return <DashboardSkeleton />;

    return (
        <div className="space-y-8 animate-fade-in-up" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 text-gradient-primary">
                        <Activity className="w-10 h-10" />
                        نظرة استراتيجية
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2">تحليل ذكي لأداء متجرك وقرارات مدعومة بالبيانات</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-12 h-12 bg-card/50 border border-border/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        onClick={() => refetch()}
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'فاتورة جديدة', icon: ShoppingCart, href: '/invoices/new', color: 'primary' },
                    { label: 'إضافة منتج', icon: Package, href: '/products', color: 'success' },
                    { label: 'سجل المبيعات', icon: FileText, href: '/reports/sales', color: 'secondary' },
                    { label: 'العملاء', icon: Users, href: '/customers', color: 'warning' },
                ].map((action, i) => (
                    <motion.a
                        key={i}
                        href={action.href}
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="glass-card p-4 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all group border-none hover:shadow-colored cursor-pointer"
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12",
                            action.color === 'primary' ? 'bg-primary/20 text-primary' :
                                action.color === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                                    action.color === 'secondary' ? 'bg-blue-500/20 text-blue-500' :
                                        'bg-amber-500/20 text-amber-500'
                        )}>
                            <action.icon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm">{action.label}</span>
                    </motion.a>
                ))}
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="مبيعات اليوم"
                    value={kpis.todaySales?.toLocaleString() || 0}
                    unit=" ج.م"
                    icon={DollarSign}
                    variant="primary"
                    subtitle={`${kpis.todayInvoices || 0} فاتورة اليوم`}
                />
                <KPICard
                    title="صافي ربح اليوم"
                    value={kpis.todayProfit?.toLocaleString() || 0}
                    unit=" ج.م"
                    icon={TrendingUp}
                    variant="success"
                    subtitle="بعد خصم المصروفات"
                />
                <KPICard
                    title="رصيد الخزينة"
                    value={kpis.cashBalance?.toLocaleString() || 0}
                    unit=" ج.م"
                    icon={Wallet}
                    variant="warning"
                />
                <KPICard
                    title="قيمة المخزون"
                    value={kpis.totalStockValue?.toLocaleString() || 0}
                    unit=" ج.م"
                    icon={Box}
                    variant="secondary"
                />
            </div>

            {/* Middle Section: Chart & Strategic Suggestions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <RevenueChart data={chartData} />

                    {/* Strategic Suggestions */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black flex items-center gap-2 px-1">
                            <Activity className="text-primary w-5 h-5" />
                            توصيات ذكية
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {strategy.suggestions.map((s, i) => (
                                <Card key={i} className="glass-card border-none hover-lift group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-150 transition-transform duration-700">
                                        <TrendingUp className="w-16 h-16 text-primary" />
                                    </div>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg font-black">{s.title}</CardTitle>
                                            <Badge variant={s.impact === 'عالي' ? 'destructive' : 'secondary'} className="rounded-lg px-2 py-0.5">
                                                أثر {s.impact}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">{s.desc}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Inventory & Recent Sales */}
                <div className="space-y-8">
                    {/* Inventory Alerts */}
                    <Card className="glass-card border-none shadow-custom-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <AlertTriangle className="text-amber-500 w-6 h-6" />
                                تنبيهات المخزون
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {lowStockProducts.map((product) => (
                                <div key={product._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[120px]">{product.name}</p>
                                            <p className="text-xs text-amber-500/80 font-bold">المتبقي: {product.stockQty}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-amber-500/20 hover:bg-amber-500/10 text-amber-500">
                                        طلب
                                    </Button>
                                </div>
                            ))}
                            {lowStockProducts.length === 0 && (
                                <div className="text-center py-6 text-sm font-medium text-emerald-500 flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">✨</div>
                                    مخزونك في حالة ممتازة
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Invoices Mini-List */}
                    <Card className="glass-card border-none shadow-custom-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-black">آخر المبيعات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.slice(0, 4).map((invoice, i) => (
                                    <div key={invoice._id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <ShoppingCart className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold truncate max-w-[100px]">#{invoice.number}</p>
                                                <p className="text-[10px] text-muted-foreground">{format(new Date(invoice.date), 'hh:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-sm">{invoice.total?.toLocaleString()} ج.م</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full mt-6 rounded-xl font-bold hover:bg-primary/10 hover:text-primary gap-2">
                                عرض كل الفواتير
                                <ArrowUpRight className="w-4 h-4" />
                            </Button>
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

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    DollarSign, ShoppingBag, TrendingUp, FileText, CreditCard,
    Banknote, Calendar, RefreshCcw, ArrowUpRight, Wallet,
    History, PieChart, Activity, Loader2
} from 'lucide-react';
import { DailySalesService } from '@/services/dailySalesService';
import { SalesChart } from '@/components/reports/SalesChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function SalesReportPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const startDateParam = searchParams.get('startDate') || format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd');
    const endDateParam = searchParams.get('endDate') || format(new Date(), 'yyyy-MM-dd');

    const [startDate, setStartDate] = useState(startDateParam);
    const [endDate, setEndDate] = useState(endDateParam);

    const { data: stats = {}, isLoading, refetch } = useQuery({
        queryKey: ['sales-report', startDateParam, endDateParam],
        queryFn: () => DailySalesService.getSalesSummary(startDateParam, endDateParam)
    });

    const handleFilter = () => {
        const params = new URLSearchParams();
        params.set('startDate', startDate);
        params.set('endDate', endDate);
        router.push(`/reports/sales?${params.toString()}`);
    };

    const formatCurrency = (val) => Number(val || 0).toLocaleString();

    // Calculate aggregated cash/credit from breakdown
    const totalCash = stats?.dailyBreakdown?.reduce((sum, day) => sum + (day.cashReceived || 0), 0) || 0;
    const totalCredit = stats?.dailyBreakdown?.reduce((sum, day) => sum + (day.creditSales || 0), 0) || 0;

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            {/* Header Section */}
            <PageHeader
                title="تقارير المبيعات"
                subtitle="تحليل الأداء المالي والأرباح للفترة المحددة"
                icon={FileText}
                actions={
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 glass-card p-2 rounded-2xl border border-white/10">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold focus:ring-0"
                            />
                            <span className="text-white/20">→</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold focus:ring-0"
                            />
                            <Button onClick={handleFilter} size="sm" className="rounded-xl h-8 px-4">تحديث</Button>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className="w-14 h-14 rounded-2xl glass-card border-white/10 hover:border-primary/50 transition-all shadow-lg"
                        >
                            <RefreshCcw className="w-6 h-6 text-muted-foreground" />
                        </Button>
                    </div>
                }
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="إجمالي المبيعات"
                    value={formatCurrency(stats.totalRevenue)}
                    unit="ج.م"
                    icon={DollarSign}
                    variant="primary"
                    subtitle="إجمالي مبيعات الفترة"
                />
                <StatCard
                    title="إجمالي الأرباح"
                    value={formatCurrency(stats.totalProfit)}
                    unit="ج.م"
                    icon={TrendingUp}
                    variant="success"
                    subtitle={`هامش ربح ${stats.totalRevenue ? Math.round((stats.totalProfit / stats.totalRevenue) * 100) : 0}%`}
                />
                <StatCard
                    title="عدد الفواتير"
                    value={stats.totalInvoices}
                    unit="فاتورة"
                    icon={ShoppingBag}
                    variant="info"
                    subtitle={`متوسط ${stats.totalInvoices ? Math.round(stats.totalRevenue / stats.totalInvoices).toLocaleString() : 0} ج.م`}
                />
                <div className="glass-card p-6 rounded-[2.5rem] border border-white/10 overflow-hidden relative group transition-all duration-500 bg-gradient-to-br from-slate-500/5 to-transparent shadow-2xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">طريقة التحصيل</p>
                            <p className="text-sm font-bold opacity-30">توزيع المدفوعات</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner group-hover:bg-primary/10 transition-colors">
                            <Banknote size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center group/item p-2 rounded-xl transition-colors hover:bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Wallet size={14} className="text-emerald-500" />
                                </div>
                                <span className="text-xs font-black opacity-60">نقدي</span>
                            </div>
                            <span className="text-lg font-black tracking-tighter tabular-nums">{formatCurrency(totalCash)}</span>
                        </div>
                        <div className="flex justify-between items-center group/item p-2 rounded-xl transition-colors hover:bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <CreditCard size={14} className="text-blue-500" />
                                </div>
                                <span className="text-xs font-black opacity-60">آجل</span>
                            </div>
                            <span className="text-lg font-black tracking-tighter tabular-nums">{formatCurrency(totalCredit)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full mt-4 overflow-hidden flex">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-[1500ms]"
                                style={{ width: `${stats.totalRevenue ? (totalCash / stats.totalRevenue) * 100 : 0}%` }}
                            />
                            <div
                                className="h-full bg-blue-500 transition-all duration-[1500ms]"
                                style={{ width: `${stats.totalRevenue ? (totalCredit / stats.totalRevenue) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden group">
                    <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                <Activity className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black">حركة المبيعات والنمو</h2>
                                <p className="text-xs font-bold text-muted-foreground opacity-50 uppercase tracking-widest">مقارنة الإيرادات بالأرباح يومياً</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-widest text-[8px]">
                                الرسم البياني للفترة
                            </Badge>
                        </div>
                    </div>

                    <div className="p-8 h-[450px]">
                        <SalesChart dailyBreakdown={stats.dailyBreakdown} />
                    </div>
                </div>

                <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden">
                    <div className="p-8 border-b border-white/10 bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-info/10 rounded-2xl border border-info/20">
                                <PieChart className="text-info" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black">تحليل الحركة</h2>
                                <p className="text-xs font-bold text-muted-foreground opacity-50 uppercase tracking-widest">تحديثات الأداء اللحظي</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Legend / Stats breakdown */}
                        <div className="space-y-4">
                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black opacity-40 uppercase tracking-widest">متوسط الفاتورة</span>
                                    <span className="text-sm font-black tabular-nums">{stats.totalInvoices ? Math.round(stats.totalRevenue / stats.totalInvoices).toLocaleString() : 0} ج.م</span>
                                </div>
                                <div className="h-px bg-white/5 w-full" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black opacity-40 uppercase tracking-widest">أعلى مبيعات يومية</span>
                                    <span className="text-sm font-black tabular-nums border-b-2 border-primary pb-0.5">
                                        {formatCurrency(Math.max(...(stats.dailyBreakdown?.map(d => d.totalRevenue) || [0])))} ج.م
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gradient-to-br from-primary/20 to-transparent rounded-[2.5rem] border border-primary/20 flex flex-col items-center justify-center text-center gap-4 group hover:scale-[1.02] transition-all duration-500 shadow-2xl">
                            <TrendingUp className="w-12 h-12 text-primary animate-bounce mt-2" />
                            <div className="space-y-1">
                                <p className="text-2xl font-black text-foreground">بياتات دقيقة</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">تحليل أداء الفترة</p>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground leading-relaxed px-4">
                                تعتمد هذه الأرقام على كافة الفواتير المسجلة بالنظام للفترة المختارة
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

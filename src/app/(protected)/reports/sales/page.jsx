import { DailySalesService } from '@/services/dailySalesService';
import { DollarSign, ShoppingBag, TrendingUp, FileText, CreditCard, Banknote, Calendar, RefreshCcw, ArrowUpRight, Wallet, History, PieChart, Activity } from 'lucide-react';
import { SalesChart } from '@/components/reports/SalesChart';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';

export default async function SalesReportPage({ searchParams }) {
    const params = await searchParams;
    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    const stats = await DailySalesService.getSalesSummary(startDate, endDate);

    const formatCurrency = (val) => Number(val || 0).toLocaleString();

    // Calculate aggregated cash/credit from breakdown
    const totalCash = stats?.dailyBreakdown?.reduce((sum, day) => sum + (day.cashReceived || 0), 0) || 0;
    const totalCredit = stats?.dailyBreakdown?.reduce((sum, day) => sum + (day.creditSales || 0), 0) || 0;

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
                    <>
                        <div className="hidden xl:flex items-center gap-6 glass-card px-8 py-4 rounded-3xl border border-white/10 shadow-xl ml-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">الفترة الحالية</span>
                                <div className="flex items-center gap-3 text-sm font-black">
                                    <Calendar size={14} className="text-primary" />
                                    <span>{startDate.toLocaleDateString('ar-EG')}</span>
                                    <span className="opacity-20 mx-1">→</span>
                                    <span>{endDate.toLocaleDateString('ar-EG')}</span>
                                </div>
                            </div>
                        </div>
                        <Link href="/reports/sales">
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-14 h-14 rounded-2xl glass-card border-white/10 hover:border-primary/50 transition-all shadow-lg"
                            >
                                <RefreshCcw className="w-6 h-6 text-muted-foreground" />
                            </Button>
                        </Link>
                    </>
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

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/utils';
import { api } from '@/lib/api-utils';
import {
    Loader2, DollarSign, CreditCard,
    TrendingUp, Calendar, ShoppingBag,
    Package
} from 'lucide-react';
import { DailySalesService } from '@/services/dailySalesService';

export default function DailySalesPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: summary = {}, isLoading } = useQuery({
        queryKey: ['daily-sales', date],
        queryFn: ({ queryKey }) => DailySalesService.getDailySales(queryKey[1])
    });

    const invoices = summary.invoices || [];
    const topProducts = summary.topProducts || [];

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            {/* Header Section */}
            <PageHeader
                title="تقرير المبيعات اليومية"
                subtitle={`ملخص المبيعات، الأرباح، والتحصيلات ليوم ${format(new Date(date), 'dd MMMM yyyy', { locale: ar })}`}
                icon={TrendingUp}
                actions={
                    <div className="flex items-center gap-3 glass-card p-2 rounded-2xl border border-white/10 shadow-xl bg-white/[0.02] backdrop-blur-xl">
                        <Calendar className="w-5 h-5 text-primary ml-2" />
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-[180px] h-10 border-none bg-transparent focus-visible:ring-0 font-black text-sm tracking-tight"
                        />
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="إجمالي المبيعات"
                    value={(summary.totalRevenue || 0).toLocaleString()}
                    unit="ج.م"
                    icon={TrendingUp}
                    variant="primary"
                    subtitle="إجمالي حركة مبيعات اليوم"
                />
                <StatCard
                    title="مبيعات نقدية"
                    value={(summary.cashReceived || 0).toLocaleString()}
                    unit="ج.م"
                    icon={DollarSign}
                    variant="success"
                    subtitle="التحصيل النقدي المباشر"
                />
                <StatCard
                    title="مبيعات آجلة"
                    value={((summary.creditSales || (summary.totalRevenue - summary.cashReceived)) || 0).toLocaleString()}
                    unit="ج.م"
                    icon={CreditCard}
                    variant="warning"
                    subtitle="المديونيات الجديدة لليوم"
                />
                <StatCard
                    title="إجمالي الربح"
                    value={(summary.grossProfit || 0).toLocaleString()}
                    unit="ج.م"
                    icon={TrendingUp}
                    variant="info"
                    subtitle="صافي ربح المبيعات"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invoices List */}
                <div className="lg:col-span-2 glass-card shadow-2xl border border-white/10 rounded-[3rem] overflow-hidden group">
                    <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-4 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                            <h2 className="text-3xl font-black tracking-tight group-hover:text-primary transition-colors">فواتير اليوم ({summary.invoiceCount || 0})</h2>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-6 bg-card/10 rounded-[2.5rem] border border-white/5 shadow-inner">
                                <Loader2 size={64} className="text-primary animate-spin" />
                                <p className="text-2xl font-black text-white/30 italic">جاري تحميل مبيعات اليوم...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-white/5 h-16 bg-white/[0.01]">
                                        <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8">رقم الفاتورة</TableHead>
                                        <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8">العميل</TableHead>
                                        <TableHead className="text-center font-black text-white/40 uppercase tracking-widest text-xs px-8">النوع</TableHead>
                                        <TableHead className="text-center font-black text-white/40 uppercase tracking-widest text-xs px-8">القيمة</TableHead>
                                        <TableHead className="text-center font-black text-white/40 uppercase tracking-widest text-xs px-8">الربح</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-96 text-center border-none">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner group">
                                                        <ShoppingBag size={64} className="text-muted-foreground/20 group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-2xl font-black text-white/30 italic">لا توجد مبيعات مسجلة لهذا اليوم</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map(invoice => (
                                            <TableRow key={invoice._id} className="group hover:bg-white/[0.02] border-white/5 h-20 transition-all duration-300">
                                                <TableCell className="px-8 font-black text-lg">{invoice.number}</TableCell>
                                                <TableCell className="px-8 font-bold text-white/70">{invoice.customerName}</TableCell>
                                                <TableCell className="px-8 text-center">
                                                    <Badge variant={invoice.paymentType === 'credit' ? 'outline' : 'secondary'} className={cn(
                                                        "px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest border-2",
                                                        invoice.paymentType === 'credit'
                                                            ? "border-amber-500/20 bg-amber-500/5 text-amber-500"
                                                            : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                                                    )}>
                                                        {invoice.paymentType === 'credit' ? 'آجل' : 'نقدي'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-8 text-center font-black text-xl tabular-nums">{invoice.total.toLocaleString()} <span className="text-[10px] opacity-40 mr-1">ج.م</span></TableCell>
                                                <TableCell className="px-8 text-center">
                                                    <span className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full font-black text-sm border border-emerald-500/20">
                                                        +{invoice.profit?.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="glass-card shadow-2xl border border-white/10 rounded-[3rem] overflow-hidden h-fit group">
                    <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            <h2 className="text-3xl font-black tracking-tight group-hover:text-emerald-500 transition-colors">الأكثر مبيعاً</h2>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        {summary.topProducts?.map((product, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="font-black text-lg tracking-tight">{product.name}</div>
                                        <div className="text-xs font-bold text-white/20 uppercase tracking-widest">{product.quantitySold} قطعة مباعة</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-xl tabular-nums">{product.revenue.toLocaleString()}</div>
                                    <div className="text-[10px] font-black text-emerald-500 tracking-tighterUppercase uppercase">ج.م كلي</div>
                                </div>
                            </div>
                        ))}
                        {(!summary.topProducts || summary.topProducts.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-12 gap-4 text-white/10">
                                <div className="p-6 bg-white/5 rounded-full">
                                    <ShoppingBag size={32} />
                                </div>
                                <p className="font-black text-sm uppercase tracking-widest">لا توجد حركة مبيعات</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

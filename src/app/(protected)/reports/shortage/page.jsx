import { ReportingService } from '@/services/reportingService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, FileWarning, RefreshCcw, Package, User, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/utils';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function ShortageReportsPage({ searchParams }) {
    const filter = (await searchParams).status || 'ALL';
    const statusParam = filter === 'ALL' ? null : filter;

    const reports = await ReportingService.getShortageReports(statusParam);

    const filterOptions = [
        { label: 'الكل', value: 'ALL', color: 'primary' },
        { label: 'قيد الانتظار', value: 'PENDING', color: 'warning' },
        { label: 'مكتمل', value: 'RESOLVED', color: 'success' },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            {/* Header Section */}
            <PageHeader
                title="بلاغات النواقص"
                subtitle="متابعة طلبات توفير البضاعة وتغطية النواقص"
                icon={FileWarning}
                actions={
                    <>
                        <div className="glass-card p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shadow-inner">
                            {filterOptions.map((opt) => (
                                <Link key={opt.value} href={`/reports/shortage?status=${opt.value}`}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                                            filter === opt.value
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "hover:bg-white/5 text-muted-foreground"
                                        )}
                                    >
                                        {opt.label}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                        <Link href="/reports/shortage">
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-12 h-12 rounded-2xl glass-card border-white/10 hover:border-primary/50 transition-all shadow-lg"
                            >
                                <RefreshCcw className="w-5 h-5 text-muted-foreground" />
                            </Button>
                        </Link>
                    </>
                }
            />

            {/* Reports List */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
                {reports.length === 0 ? (
                    <div className="col-span-full h-96 glass-card rounded-[2.5rem] border border-white/10 border-dashed flex flex-col items-center justify-center gap-6">
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner group">
                            <AlertCircle className="h-20 w-20 text-muted-foreground/20 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-2 text-center">
                            <p className="text-2xl font-black text-white/30 uppercase tracking-widest">لا توجد بلاغات نواقص</p>
                            <p className="text-sm text-white/10 font-bold uppercase tracking-widest">تحقق من معايير التصفية</p>
                        </div>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div
                            key={report._id}
                            className="group glass-card rounded-[2.5rem] border border-white/10 overflow-hidden hover:bg-white/[0.04] transition-all duration-500 shadow-2xl relative animate-in fade-in slide-in-from-bottom-4"
                        >
                            {/* Status Indicator Bar */}
                            <div className={cn(
                                "absolute top-0 right-0 left-0 h-1.5",
                                report.status === 'PENDING' ? 'bg-amber-500/50' : 'bg-emerald-500/50'
                            )}></div>

                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-4">
                                        <Badge
                                            className={cn(
                                                "font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-lg",
                                                report.status === 'PENDING'
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {report.status === 'PENDING' ? <Clock size={12} /> : <CheckCircle size={12} />}
                                                {report.status === 'PENDING' ? 'قيد الانتظار' : 'تم الرد'}
                                            </div>
                                        </Badge>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                            <Calendar size={10} />
                                            {new Date(report.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1 text-right">مقدم الطلب</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <User size={14} className="text-primary" />
                                            <p className="font-black text-sm text-foreground">{report.requesterName}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                        <Package className="w-6 h-6 opacity-30" />
                                        {report.productName}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                                            <span className="text-white/40 uppercase tracking-widest text-[8px] font-black">الكمية المطلوبة</span>
                                            <span className="text-foreground text-xl tracking-tighter font-black tabular-nums">{report.requestedQty}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                                            <span className="text-white/40 uppercase tracking-widest text-[8px] font-black">المتوفر حالياً</span>
                                            <span className="text-foreground text-xl tracking-tighter font-black tabular-nums text-primary">{report.availableQty}</span>
                                        </div>
                                    </div>
                                </div>

                                {report.notes && (
                                    <div className="relative group/notes">
                                        <div className="absolute -inset-2 bg-primary/5 rounded-2xl blur-lg group-hover/notes:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100" />
                                        <p className="relative z-10 text-sm font-bold text-muted-foreground bg-white/5 p-4 rounded-2xl border border-white/10 italic leading-relaxed border-r-4 border-r-primary">
                                            "{report.notes}"
                                        </p>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <Link
                                        href={`/products?search=${report.productName}`}
                                        className="text-xs font-black text-primary hover:text-primary/70 flex items-center gap-2 transition-all active:scale-95 group/link"
                                    >
                                        <ExternalLink size={14} className="group-hover/link:rotate-12 transition-transform" />
                                        عرض تفاصيل الصنف
                                    </Link>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-20 tabular-nums">ID: {report._id?.slice(-6).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

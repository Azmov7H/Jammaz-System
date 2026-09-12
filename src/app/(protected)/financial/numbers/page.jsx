'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Wallet, Printer, Eye, RefreshCcw, Loader2, AlertCircle, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { useNumberReport, useTreasuryTransactions } from '@/hooks/useFinancial';
import { getNumberReport, getTreasuryTransactions } from '@/services/financeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { NumberReportPrintView } from '@/components/financial/NumberReportPrintView';
import { DocumentPrintStyles } from '@/components/documents/DocumentPrintStyles';
import {
    METHOD_AR,
    NUMBER_TYPE_FILTERS,
    UNASSIGNED_KEY,
    formatNumberKey,
    isNumberReportMethod,
    resolveTypeFilter,
} from '@/lib/numberReport';
import { todayLocal, toLocalYmd } from '@/lib/dates';
import { cn } from '@/utils';

const PERIODS = [
    { id: 'TODAY', label: 'اليوم' },
    { id: 'MONTH', label: 'هذا الشهر' },
    { id: 'YEAR', label: 'هذه السنة' },
    { id: 'CUSTOM', label: 'مخصص' },
];

function fmtAmount(value) {
    return Number(value ?? 0).toLocaleString('en-US');
}

function fmtDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return `${d.toLocaleDateString('ar-EG')} ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
}

const TYPE_AR = { INCOME: 'وارد', EXPENSE: 'صادر' };

export default function NumberReportPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const method = searchParams.get('method');
    const valid = isNumberReportMethod(method);

    const [period, setPeriod] = useState('MONTH');
    const [businessDay] = useState(() => todayLocal());
    const [customDates, setCustomDates] = useState(() => {
        const t = todayLocal();
        return { startDate: t, endDate: t };
    });
    const [typeFilter, setTypeFilter] = useState('ALL');
    // Selection is derived: every known number is selected unless the user
    // explicitly excluded it. No sync effect — newly arriving numbers join
    // the default "all" without clobbering user toggles.
    const [excluded, setExcluded] = useState([]);
    const [focused, setFocused] = useState(null);
    const [detailPage, setDetailPage] = useState(1);
    const [showPreview, setShowPreview] = useState(false);
    const [printPayload, setPrintPayload] = useState(null);
    const [isPrintLoading, setIsPrintLoading] = useState(false);
    const printAfterLoad = useRef(false);

    const dateRange = useMemo(() => {
        const end = new Date();
        const start = new Date();
        if (period === 'TODAY') start.setHours(0, 0, 0, 0);
        else if (period === 'MONTH') { start.setDate(1); start.setHours(0, 0, 0, 0); }
        else if (period === 'YEAR') { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
        else if (period === 'CUSTOM') return { startDate: customDates.startDate, endDate: customDates.endDate };
        return { startDate: toLocalYmd(start), endDate: toLocalYmd(end) };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period, customDates, businessDay]);

    const typeParams = useMemo(() => resolveTypeFilter(typeFilter), [typeFilter]);
    const periodLabel = PERIODS.find((p) => p.id === period)?.label || 'مخصص';

    const { data: reportData, isLoading, isError, refetch } = useNumberReport(
        { method, ...dateRange, ...typeParams },
        { enabled: valid }
    );
    const numbers = useMemo(() => reportData?.numbers ?? [], [reportData]);
    const totals = reportData?.totals ?? {};

    const excludedSet = useMemo(() => new Set(excluded), [excluded]);
    const selectedSet = useMemo(() => new Set(numbers.map((r) => r.number).filter((k) => !excludedSet.has(k))), [numbers, excludedSet]);
    const visibleSections = useMemo(() => numbers.filter((r) => selectedSet.has(r.number)), [numbers, selectedSet]);

    const toggleNumber = useCallback((key) => {
        setExcluded((prev) => {
            const base = new Set(prev);
            if (base.has(key)) base.delete(key);
            else base.add(key);
            return [...base];
        });
    }, []);

    // Focused-number detail rows (server-paginated, same filters).
    const detailParams = useMemo(() => ({ ...dateRange, ...typeParams }), [dateRange, typeParams]);
    const { data: detailData, isLoading: isDetailLoading } = useTreasuryTransactions(
        detailParams,
        { page: detailPage, limit: 50, method, sourceNumber: focused },
        { enabled: valid && focused !== null }
    );
    const detailRows = detailData?.transactions ?? [];
    const detailTotal = detailData?.total ?? 0;
    const detailTotalPages = Math.max(1, Math.ceil(detailTotal / 50));

    const focusNumber = useCallback((key) => {
        setFocused(key);
        setDetailPage(1);
    }, []);

    useEffect(() => {
        if (printAfterLoad.current && printPayload) {
            printAfterLoad.current = false;
            const t = setTimeout(() => window.print(), 80);
            return () => clearTimeout(t);
        }
    }, [printPayload]);

    // Print single / selected / all: aggregates + grand total come from a
    // fresh server query for the printed set (never summed client-side).
    // Detail rows attach only when exactly one number is printed.
    const handlePrint = useCallback(async (keys) => {
        if (!keys.length) {
            toast.error('اختر رقمًا واحدًا على الأقل للطباعة');
            return;
        }
        setIsPrintLoading(true);
        try {
            const res = await getNumberReport({ method, ...dateRange, ...typeParams, numbers: keys.join(',') });
            const sections = res?.numbers ?? [];
            let detailsByNumber = {};
            if (keys.length === 1) {
                let page = 1, all = [], total = Infinity;
                while (all.length < total && page <= 5) {
                    const r = await getTreasuryTransactions({ method, sourceNumber: keys[0], ...dateRange, ...typeParams, page, limit: 100 });
                    const txs = Array.isArray(r) ? r : (r?.transactions ?? r?.data ?? []);
                    total = Array.isArray(r) ? txs.length : (Number(r?.total) || txs.length);
                    if (!txs.length) break;
                    all = all.concat(txs);
                    if (all.length >= total) break;
                    page += 1;
                }
                detailsByNumber = { [keys[0]]: all };
            }
            printAfterLoad.current = true;
            setPrintPayload({ sections, totals: res?.totals ?? {}, detailsByNumber });
        } catch (e) {
            toast.error(e?.message || 'تعذر تجهيز التقرير للطباعة');
        } finally {
            setIsPrintLoading(false);
        }
    }, [method, dateRange, typeParams]);

    const refreshAll = useCallback(() => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['number-report'] });
    }, [refetch, queryClient]);

    if (!valid) {
        return (
            <div className="space-y-6" dir="rtl">
                <Card>
                    <CardContent className="py-10 text-center space-y-4">
                        <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
                        <p className="font-bold">تقرير الأرقام متاح للمحفظة وانستا باي فقط</p>
                        <Button variant="outline" onClick={() => router.push('/financial')} className="gap-2">
                            <ArrowRight className="h-4 w-4" /> العودة للخزينة
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const methodLabel = METHOD_AR[method];

    return (
        <>
        <div className="space-y-6 print:hidden" dir="rtl">
            <PageHeader
                title={`تقرير أرقام ${methodLabel}`}
                subtitle="حركة كل رقم — الوارد والصادر والصافي من سجل الخزينة"
                icon={Wallet}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={refreshAll} className="gap-2" aria-label="تحديث">
                            <RefreshCcw className="h-4 w-4" /> تحديث
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => setShowPreview((v) => !v)}
                            className="gap-2" aria-label="معاينة التقرير"
                        >
                            <Eye className="h-4 w-4" /> {showPreview ? 'إخفاء المعاينة' : 'معاينة'}
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => handlePrint(visibleSections.map((s) => s.number))}
                            disabled={isPrintLoading}
                            className="gap-2" aria-label="طباعة المحدد"
                        >
                            {isPrintLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                            طباعة المحدد ({visibleSections.length})
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => handlePrint(numbers.map((r) => r.number))}
                            disabled={isPrintLoading || numbers.length === 0}
                            className="gap-2" aria-label="طباعة كل الأرقام"
                        >
                            <Printer className="h-4 w-4" /> طباعة الكل
                        </Button>
                    </div>
                }
            />

            {/* Filters */}
            <Card>
                <CardContent className="pt-4 flex flex-wrap items-end gap-3">
                    <div className="flex gap-1.5">
                        {PERIODS.map((p) => (
                            <Button key={p.id} size="sm" variant={period === p.id ? 'default' : 'outline'} onClick={() => setPeriod(p.id)}>
                                {p.label}
                            </Button>
                        ))}
                    </div>
                    {period === 'CUSTOM' && (
                        <div className="flex items-end gap-2">
                            <div className="space-y-1">
                                <Label>من</Label>
                                <Input type="date" value={customDates.startDate} onChange={(e) => setCustomDates((d) => ({ ...d, startDate: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <Label>إلى</Label>
                                <Input type="date" value={customDates.endDate} onChange={(e) => setCustomDates((d) => ({ ...d, endDate: e.target.value }))} />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-1.5 flex-wrap">
                        {NUMBER_TYPE_FILTERS.map((f) => (
                            <Button key={f.id} size="sm" variant={typeFilter === f.id ? 'default' : 'outline'} onClick={() => setTypeFilter(f.id)}>
                                {f.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Grand total (server-computed) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'إجمالي الوارد', value: totals.received },
                    { label: 'إجمالي الصادر', value: totals.withdrawn },
                    { label: 'الصافي', value: totals.net },
                    { label: 'عدد الحركات', value: totals.count },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="pt-4">
                            <p className="text-xs font-bold text-muted-foreground">{s.label}</p>
                            <p dir="ltr" className="text-2xl font-bold tabular-nums text-right">{fmtAmount(s.value)} <span className="text-sm font-medium">ج.م</span></p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Number overview */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 gap-3">
                    {[0, 1].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
            ) : isError ? (
                <Card><CardContent className="py-8 text-center text-destructive font-bold">تعذر تحميل التقرير</CardContent></Card>
            ) : numbers.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground font-bold">لا توجد حركات {methodLabel} في هذه الفترة</CardContent></Card>
            ) : (
                <>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-muted-foreground">
                        الأرقام ({numbers.length}) — المحدد ({visibleSections.length})
                    </p>
                    <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setExcluded([])}>تحديد الكل</Button>
                        <Button size="sm" variant="outline" onClick={() => setExcluded(numbers.map((r) => r.number))}>إلغاء الكل</Button>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                    {numbers.map((r) => {
                        const checked = selectedSet.has(r.number);
                        const isFocused = focused === r.number;
                        return (
                            <Card key={r.number} className={cn(isFocused && 'ring-2 ring-primary')}>
                                <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                                    <CardTitle dir="ltr" className="text-lg font-bold tabular-nums text-left">
                                        {formatNumberKey(r.number)}
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => toggleNumber(r.number)} aria-label={checked ? 'إلغاء تحديد الرقم' : 'تحديد الرقم'}>
                                        {checked ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                                    </Button>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                                    <p>الوارد: <span dir="ltr" className="font-bold tabular-nums text-success">{fmtAmount(r.received)}</span></p>
                                    <p>الصادر: <span dir="ltr" className="font-bold tabular-nums text-destructive">{fmtAmount(r.withdrawn)}</span></p>
                                    <p>الحركات: <span dir="ltr" className="font-bold tabular-nums">{fmtAmount(r.count)}</span></p>
                                    <p>الصافي: <span dir="ltr" className={cn('font-bold tabular-nums', r.net < 0 ? 'text-destructive' : 'text-success')}>{fmtAmount(r.net)}</span></p>
                                    <div className="col-span-2 flex gap-2 mt-1">
                                        <Button size="sm" variant={isFocused ? 'default' : 'outline'} onClick={() => focusNumber(r.number)}>
                                            التفاصيل
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handlePrint([r.number])} disabled={isPrintLoading} className="gap-1">
                                            <Printer className="h-3.5 w-3.5" /> طباعة الرقم
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
                </>
            )}

            {/* Detail */}
            {focused !== null && (
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold">
                            حركات الرقم <span dir="ltr" className="tabular-nums">{formatNumberKey(focused)}</span>
                            <span className="text-xs font-medium text-muted-foreground"> — {detailTotal} حركة</span>
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setFocused(null)}>إغلاق</Button>
                    </CardHeader>
                    <CardContent>
                        {isDetailLoading ? (
                            <Skeleton className="h-24 rounded-xl" />
                        ) : detailRows.length === 0 ? (
                            <p className="text-center text-muted-foreground font-bold py-6">لا توجد حركات مطابقة</p>
                        ) : (
                            <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-right text-muted-foreground border-b">
                                            <th className="py-2 px-2">التاريخ</th>
                                            <th className="py-2 px-2">النوع</th>
                                            <th className="py-2 px-2">المبلغ</th>
                                            <th className="py-2 px-2">الطرف</th>
                                            <th className="py-2 px-2">الوصف</th>
                                            <th className="py-2 px-2">السند</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailRows.map((tx) => (
                                            <tr key={tx._id} className="border-b border-white/5">
                                                <td className="py-2 px-2 whitespace-nowrap">{fmtDateTime(tx.date || tx.createdAt)}</td>
                                                <td className="py-2 px-2">{TYPE_AR[tx.type] || tx.type}</td>
                                                <td dir="ltr" className={cn('py-2 px-2 font-bold tabular-nums text-right', tx.type === 'INCOME' ? 'text-success' : 'text-destructive')}>
                                                    {tx.type === 'INCOME' ? '+' : '−'}{fmtAmount(tx.amount)}
                                                </td>
                                                <td className="py-2 px-2">{tx.referenceId?.name || tx.referenceId?.customer?.name || tx.referenceId?.supplier?.name || '—'}</td>
                                                <td className="py-2 px-2 text-muted-foreground">{tx.description || '—'}</td>
                                                <td dir="ltr" className="py-2 px-2 tabular-nums">{tx.receiptNumber || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between pt-3 text-sm">
                                <Button size="sm" variant="outline" disabled={detailPage <= 1} onClick={() => setDetailPage((p) => p - 1)}>السابق</Button>
                                <span className="font-bold text-muted-foreground">صفحة {detailTotalPages === 0 ? 0 : detailPage} من {detailTotalPages}</span>
                                <Button size="sm" variant="outline" disabled={detailPage >= detailTotalPages} onClick={() => setDetailPage((p) => p + 1)}>التالي</Button>
                            </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* On-screen preview reuses the exact print component */}
            {showPreview && printPayload && (
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base font-bold">معاينة التقرير</CardTitle></CardHeader>
                    <CardContent className="bg-white text-slate-900 rounded-2xl overflow-hidden" dir="rtl">
                        <NumberReportPrintView
                            forceVisible
                            methodLabel={methodLabel}
                            periodLabel={periodLabel}
                            dateRange={dateRange}
                            sections={printPayload.sections}
                            totals={printPayload.totals}
                            detailsByNumber={printPayload.detailsByNumber}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
        <NumberReportPrintView
            methodLabel={methodLabel}
            periodLabel={periodLabel}
            dateRange={dateRange}
            sections={printPayload?.sections ?? []}
            totals={printPayload?.totals ?? {}}
            detailsByNumber={printPayload?.detailsByNumber ?? {}}
        />
        <DocumentPrintStyles />
        </>
    );
}

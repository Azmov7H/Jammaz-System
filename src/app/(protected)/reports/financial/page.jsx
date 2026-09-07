'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Printer, RefreshCcw, AlertCircle, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFinancialReport } from '@/hooks/useReports';
import { DocumentPrintStyles } from '@/components/documents/DocumentPrintStyles';

const toInputDate = (d) => format(d, 'yyyy-MM-dd');
const monthStart = () => {
    const now = new Date();
    return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const fmtMoney = (n) => `${Number(n || 0).toLocaleString()} ج.م`;

function formatDay(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return format(d, 'dd MMM yyyy', { locale: ar });
}

function MoneyRow({ label, value, expense = false }) {
    return (
        <div className="flex justify-between text-muted-foreground">
            <span>{label}</span>
            <span dir="ltr" className={expense ? 'text-destructive' : undefined}>
                {expense ? `(${Number(value || 0).toLocaleString()})` : Number(value || 0).toLocaleString()} ج.م
            </span>
        </div>
    );
}

function BreakdownSection({ title, entries, totalLabel, total, expense = false }) {
    return (
        <section>
            <h3 className="text-lg font-bold text-foreground mb-4 border-b pb-2">{title}</h3>
            <div className="space-y-2">
                {Object.entries(entries || {}).map(([name, val]) => (
                    <MoneyRow key={name} label={name} value={val} expense={expense} />
                ))}
                <div className="flex justify-between font-bold text-foreground pt-2 mt-2 border-t border-dashed">
                    <span>{totalLabel}</span>
                    <span dir="ltr" className={expense ? 'text-destructive' : undefined}>
                        {expense
                            ? `(${Number(total || 0).toLocaleString()})`
                            : Number(total || 0).toLocaleString()} ج.م
                    </span>
                </div>
            </div>
        </section>
    );
}

export default function FinancialReportPage() {
    const [startDate, setStartDate] = useState(monthStart);
    const [endDate, setEndDate] = useState(() => toInputDate(new Date()));

    const datesReady = Boolean(startDate && endDate);
    const { data: response, isLoading, isError, error, refetch, isFetching } =
        useFinancialReport(startDate, endDate);

    const financials = response?.financials || {};
    const hasAnyData = (financials?.revenue?.total || 0) > 0
        || (financials?.operatingExpenses?.total || 0) > 0
        || (financials?.cogs || 0) > 0;
    const isProfitable = (financials?.netProfit || 0) >= 0;

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin" /></div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto print:max-w-none">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
                <div className="flex gap-4 items-end flex-wrap">
                    <div>
                        <Label>من تاريخ</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <Label>إلى تاريخ</Label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <Button
                        onClick={() => refetch()}
                        variant="outline"
                        size="icon"
                        disabled={isFetching || !datesReady}
                        aria-label="تحديث التقرير"
                        title="تحديث التقرير"
                    >
                        <RefreshCcw className={isFetching ? "animate-spin" : ""} />
                    </Button>
                </div>
                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="w-4 h-4" /> طباعة التقرير
                </Button>
            </div>

            {/* Report Paper */}
            <Card className="border shadow-lg print:shadow-none print:border-none">
                <CardHeader className="text-center border-b pb-8">
                    <CardTitle className="text-3xl font-bold text-foreground">قائمة الدخل</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        عن الفترة من {formatDay(startDate)} إلى {formatDay(endDate)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">

                    {isError ? (
                        <div className="flex flex-col items-center gap-4 p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-destructive" />
                            <div>
                                <h3 className="font-bold text-destructive text-lg">تعذر تحميل التقرير</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {error?.message || 'حدث خطأ أثناء جلب البيانات من الخادم'}
                                </p>
                            </div>
                            <Button onClick={() => refetch()} variant="outline" className="gap-2">
                                <RefreshCcw className="w-4 h-4" /> إعادة المحاولة
                            </Button>
                        </div>
                    ) : !datesReady ? (
                        <div className="flex flex-col items-center gap-3 p-12 text-center">
                            <CalendarDays className="w-10 h-10 text-muted-foreground/40" />
                            <h3 className="font-bold text-lg">اختر الفترة الزمنية</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                حدد تاريخ البداية والنهاية لعرض قائمة الدخل.
                            </p>
                        </div>
                    ) : !hasAnyData ? (
                        <div className="flex flex-col items-center gap-3 p-12 text-center">
                            <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
                            <h3 className="font-bold text-lg">لا توجد بيانات محاسبية لهذه الفترة</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                لم يتم تسجيل أي قيود محاسبية (مبيعات، مصروفات، أو تكاليف بضاعة) في الفترة المختارة. جرّب توسيع النطاق الزمني أو تحقق من تسجيل الفواتير بشكل صحيح.
                            </p>
                        </div>
                    ) : (
                        <>
                            <BreakdownSection
                                title="الإيرادات"
                                entries={financials?.revenue?.breakdown}
                                totalLabel="إجمالي الإيرادات"
                                total={financials?.revenue?.total}
                            />

                            <section>
                                <MoneyRow label="تكلفة البضاعة المباعة" value={financials?.cogs} expense />
                                <div className="flex justify-between font-bold text-xl bg-muted/50 p-4 rounded-lg mt-4 border">
                                    <span>مجمل الربح (Gross Profit)</span>
                                    <span dir="ltr">{fmtMoney(financials?.grossProfit)}</span>
                                </div>
                            </section>

                            <BreakdownSection
                                title="المصروفات التشغيلية"
                                entries={financials?.operatingExpenses?.breakdown}
                                totalLabel="إجمالي المصروفات"
                                total={financials?.operatingExpenses?.total}
                                expense
                            />

                            <section className="mt-8 pt-8 border-t-2 border-foreground">
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold">صافي الربح (Net Profit)</span>
                                    <span dir="ltr" className={`text-3xl font-bold ${isProfitable ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'} px-6 py-2 rounded-xl`}>
                                        {fmtMoney(financials?.netProfit)}
                                    </span>
                                </div>
                            </section>
                        </>
                    )}

                </CardContent>
            </Card>
            {/* Shared print isolation: hides header/aside/nav so the print
                button outputs the income statement, not the app shell. */}
            <DocumentPrintStyles />
        </div>
    );
}

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTreasury, useTreasuryTransactions, useCashFlow, useAddTransaction, useDeleteTransaction, useSupplierPayment } from '@/hooks/useFinancial';
import { getTreasuryTransactions } from '@/services/financeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Loader2, RefreshCcw, AlertCircle, Printer, PiggyBank } from 'lucide-react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { TransactionsTable } from '@/components/financial/TransactionsTable';
import { TransactionDetailsDialog } from '@/components/financial/TransactionDetailsDialog';
import { AddTransactionDialog } from '@/components/financial/AddTransactionDialog';
import { TahweeshDialog } from '@/components/financial/TahweeshDialog';
import { CashFlowChart } from '@/components/financial/CashFlowChart';
import { MethodBalancesCard } from '@/components/financial/MethodBalancesCard';
import { PeriodPerformanceCard } from '@/components/financial/PeriodPerformanceCard';
import { DebtSnapshotCard } from '@/components/financial/DebtSnapshotCard';
import { labelCashFlowBuckets } from '@/components/financial/cashFlowUtils';
import { matchesTypeFilter, exportFiltersFor } from '@/lib/treasuryFilters';
import { todayLocal, toLocalYmd } from '@/lib/dates';
import { ExportButton } from '@/components/common/ExportButton';
import { TreasuryPrintView } from '@/components/financial/TreasuryPrintView';
import { DocumentPrintStyles } from '@/components/documents/DocumentPrintStyles';

const EMPTY_TX_FORM = {
    amount: '',
    description: '',
    type: 'INCOME',
    category: 'other',
    supplierId: '',
    method: 'cash',
    sourceNumber: ''
};

const PERIODS = [
    { id: 'TODAY', label: 'اليوم' },
    { id: 'MONTH', label: 'هذا الشهر' },
    { id: 'YEAR', label: 'هذه السنة' },
    { id: 'CUSTOM', label: 'مخصص' },
];

function SectionHeading({ title, scope }) {
    return (
        <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {scope && (
                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {scope}
                </span>
            )}
        </div>
    );
}

export default function FinancialPage() {
    const [period, setPeriod] = useState('MONTH');
    const [typeFilter, setTypeFilter] = useState('ALL');
    // Business-day anchor: local (Egypt) calendar day, re-checked on an
    // interval below so the page follows midnight without a manual refresh.
    // customDates always derives from it — never a mount-frozen UTC string.
    const [businessDay, setBusinessDay] = useState(() => todayLocal());
    const [customDates, setCustomDates] = useState(() => {
        const t = todayLocal();
        return { startDate: t, endDate: t };
    });

    const queryClient = useQueryClient();
    const { data: suppliers } = useSuppliers({ limit: 100 });

    const getDateRange = useCallback(() => {
        const end = new Date();
        const start = new Date();

        if (period === 'TODAY') {
            start.setHours(0, 0, 0, 0);
        } else if (period === 'MONTH') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
        } else if (period === 'YEAR') {
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
        } else if (period === 'CUSTOM') {
            return {
                startDate: customDates.startDate,
                endDate: customDates.endDate
            };
        }

        // Local business-day strings (never UTC): Egypt spends the first
        // hours of each day on the previous UTC date. `businessDay` is an
        // explicit dep so the range recomputes on midnight rollover.
        return {
            startDate: toLocalYmd(start),
            endDate: toLocalYmd(end)
        };
    }, [period, customDates, businessDay]);

    const { data: treasuryData, isLoading, dataUpdatedAt: treasuryUpdatedAt } = useTreasury(getDateRange());
    const { mutate: addTransaction, isPending } = useAddTransaction();
    const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();
    const { mutate: paySupplier, isPending: isPayingSupplier } = useSupplierPayment();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [formData, setFormData] = useState(EMPTY_TX_FORM);

    const dateRange = getDateRange();

    // Server-paginated ledger: the INCOME/EXPENSE views filter by `type`
    // and the supplier/shop views by `category` — the table never pages
    // through a client-side slice again.
    const [txPage, setTxPage] = useState(1);
    const resetTxPage = useCallback(() => setTxPage(1), []);

    // Calendar-day rollover: once a minute is plenty (no extra polling —
    // the existing 30s data refetch already covers freshness). On flip,
    // re-anchor customDates and invalidate the date-scoped treasury caches
    // so queries (keyed by range) refetch for the new business day.
    useEffect(() => {
        const timer = setInterval(() => {
            const t = todayLocal();
            if (t === businessDay) return;
            setBusinessDay(t);
            setCustomDates({ startDate: t, endDate: t });
            resetTxPage();
            queryClient.invalidateQueries({ queryKey: ['treasury'] });
            queryClient.invalidateQueries({ queryKey: ['treasury-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['treasury-cashflow'] });
        }, 60 * 1000);
        return () => clearInterval(timer);
    }, [businessDay, queryClient, resetTxPage]);
    const handleTypeFilterChange = useCallback((f) => {
        setTypeFilter(f);
        setTxPage(1);
    }, []);
    const serverType = typeFilter === 'INCOME' || typeFilter === 'EXPENSE' ? typeFilter : undefined;
    const serverCategory = typeFilter === 'SUPPLIER_PAYMENTS'
        ? 'supplier_payments'
        : typeFilter === 'SHOP_EXPENSES' ? 'shop_expenses' : undefined;

    const {
        data: ledger,
        isFetching: isTransactionsFetching,
        isError: isTransactionsError,
        error: transactionsError,
        refetch: refetchTransactions
    } = useTreasuryTransactions(dateRange, { page: txPage, type: serverType, category: serverCategory });

    const allTransactions = useMemo(() => ledger?.transactions ?? [], [ledger]);
    const totalTransactions = ledger?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalTransactions / (ledger?.limit || 100)));

    // Full-period chart buckets, aggregated server-side so the chart always
    // covers the same window as the stat cards (the ledger above is capped
    // to the latest page and must not feed period figures).
    const { data: cashFlow } = useCashFlow(dateRange);
    const cashFlowData = useMemo(
        () => labelCashFlowBuckets(cashFlow?.buckets, cashFlow?.granularity),
        [cashFlow]
    );

    const resetForm = useCallback(() => setFormData(EMPTY_TX_FORM), []);

    const handleSubmit = async () => {
        if (!formData.amount || !formData.description) return;

        if (formData.type === 'EXPENSE' && formData.category === 'supplier') {
            if (!formData.supplierId) {
                toast.error('يرجى اختيار مورد');
                return;
            }

            paySupplier({
                supplierId: formData.supplierId,
                amount: parseFloat(formData.amount),
                method: formData.method,
                note: formData.description
            }, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    resetForm();
                }
            });
            return;
        }

        addTransaction(formData, {
            onSuccess: () => {
                setIsDialogOpen(false);
                resetForm();
            }
        });
    };

    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const filteredTransactions = useMemo(
        () => allTransactions.filter(tx => matchesTypeFilter(tx, typeFilter)),
        [allTransactions, typeFilter]
    );

    const handleDelete = (id) => {
        setDeleteTargetId(id);
    };

    const handleConfirmDelete = () => {
        if (deleteTargetId) {
            deleteTransaction(deleteTargetId);
        }
        setDeleteTargetId(null);
    };

    const balance = treasuryData?.balance || 0;

    // Direct print: fetch the FULL filtered ledger (the on-screen table is
    // page-capped and must never feed the report), render the print-only
    // view, then open the browser print dialog — the user picks "Save as
    // PDF" there to keep a file on their device. No export step involved.
    const [printRows, setPrintRows] = useState(null);
    const [isPrintLoading, setIsPrintLoading] = useState(false);
    const printAfterLoad = useRef(false);

    useEffect(() => {
        if (printAfterLoad.current && printRows) {
            printAfterLoad.current = false;
            const t = setTimeout(() => window.print(), 80);
            return () => clearTimeout(t);
        }
    }, [printRows]);

    const printSummary = useMemo(() => {
        const rows = printRows ?? [];
        let income = 0, expense = 0;
        for (const tx of rows) {
            if (tx.type === 'INCOME') income += Number(tx.amount) || 0;
            else expense += Number(tx.amount) || 0;
        }
        return { income, expense, net: income - expense, count: rows.length };
    }, [printRows]);

    const handlePrint = useCallback(async () => {
        setIsPrintLoading(true);
        try {
            const base = { ...dateRange, limit: 100 };
            if (serverType) base.type = serverType;
            if (serverCategory) base.category = serverCategory;
            let page = 1, all = [], total = Infinity;
            while (all.length < total && page <= 100) {
                const res = await getTreasuryTransactions({ ...base, page });
                const txs = Array.isArray(res) ? res : (res?.transactions ?? res?.data ?? []);
                total = Array.isArray(res) ? txs.length : (Number(res?.total) || txs.length);
                if (txs.length === 0) break;
                all = all.concat(txs);
                if (all.length >= total) break;
                page += 1;
            }
            printAfterLoad.current = true;
            setPrintRows(all);
        } catch (e) {
            toast.error(e?.message || 'تعذر تجهيز التقرير للطباعة');
        } finally {
            setIsPrintLoading(false);
        }
    }, [dateRange, serverType, serverCategory]);

    const handleTxClick = (tx) => {
        setSelectedTx(tx);
        setIsDetailsOpen(true);
    };

    // Period aggregates come from the server summary (same DB window as the
    // stat cards) — never recomputed over the page-capped ledger list.
    const periodStats = {
        income: treasuryData?.totalIncome || 0,
        expense: treasuryData?.totalExpense || 0,
        supplierPayments: treasuryData?.supplierPayments || 0,
        shopExpenses: treasuryData?.shopExpenses || 0,
        salesProfit: treasuryData?.salesProfit || 0,
        totalDebt: treasuryData?.totalOutstandingDebt || 0,
        net: treasuryData?.periodBalance || 0,
        transactionCount: treasuryData?.transactionCount || 0
    };

    const refreshAll = () => {
        refetchTransactions();
        queryClient.invalidateQueries({ queryKey: ['treasury'] });
        queryClient.invalidateQueries({ queryKey: ['treasury-cashflow'] });
    };

    const lastUpdated = useMemo(() => {
        if (!treasuryUpdatedAt) return null;
        return new Date(treasuryUpdatedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, [treasuryUpdatedAt]);

    const periodLabel = PERIODS.find((p) => p.id === period)?.label || 'مخصص';
    const liveSubtitle = lastUpdated
        ? `تحديث تلقائي كل 30 ثانية — آخر تحديث ${lastUpdated}`
        : 'تحديث تلقائي كل 30 ثانية';

    return (
        <>
        <div className="space-y-6 print:hidden" dir="rtl">
            <PageHeader
                title="الخزينة"
                subtitle={liveSubtitle}
                icon={Wallet}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshAll}
                            disabled={isTransactionsFetching}
                            className="gap-2"
                            aria-label="تحديث"
                        >
                            <RefreshCcw className={cn("h-4 w-4", isTransactionsFetching && "animate-spin")} />
                            تحديث
                        </Button>
                        <ExportButton
                            type="treasuryTransactions"
                            filters={exportFiltersFor(typeFilter, getDateRange())}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            disabled={isPrintLoading}
                            className="gap-2"
                            aria-label="طباعة التقرير"
                        >
                            {isPrintLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Printer className="h-4 w-4" />}
                            {isPrintLoading ? 'جاري التجهيز…' : 'طباعة التقرير'}
                        </Button>
                        <AddTransactionDialog
                            open={isDialogOpen}
                            onOpenChange={setIsDialogOpen}
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSubmit}
                            isPending={isPending || isPayingSupplier}
                            suppliers={suppliers}
                        />
                        <TahweeshDialog breakdown={treasuryData?.breakdown} />
                    </div>
                }
            />

            <Card className="p-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground px-2">
                    نطاق الفترة — للأداء والتدفق والسجل فقط (الوضع النقدي والمستحقات لحظية دائمًا)
                </span>
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                    {PERIODS.map(p => (
                        <Button
                            key={p.id}
                            variant={period === p.id ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => { setPeriod(p.id); resetTxPage(); }}
                            className="text-xs h-8"
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
                {period === 'CUSTOM' ? (
                    <div className="flex flex-wrap items-end gap-3 px-2">
                        <div className="space-y-1">
                            <Label className="text-xs">من تاريخ</Label>
                            <Input
                                type="date"
                                className="h-9 w-40"
                                value={customDates.startDate}
                                onChange={e => { setCustomDates({ ...customDates, startDate: e.target.value }); resetTxPage(); }}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">إلى تاريخ</Label>
                            <Input
                                type="date"
                                className="h-9 w-40"
                                value={customDates.endDate}
                                onChange={e => { setCustomDates({ ...customDates, endDate: e.target.value }); resetTxPage(); }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-2">
                        <Label className="text-xs text-muted-foreground">تاريخ محدد:</Label>
                            <Input
                                type="date"
                                className="h-8 w-36 text-xs"
                                value={dateRange.startDate}
                            onChange={e => {
                                setCustomDates({ startDate: e.target.value, endDate: e.target.value });
                                setPeriod('CUSTOM');
                                resetTxPage();
                            }}
                        />
                    </div>
                )}
            </Card>

            <section aria-label="الوضع النقدي الحالي" className="space-y-3">
                <SectionHeading title="الوضع النقدي الحالي" scope="لحظي" />
                {isLoading ? (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <Skeleton className="h-64 rounded-3xl" />
                        <Skeleton className="h-64 rounded-3xl xl:col-span-2" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <div className="space-y-4">
                            <StatCard
                                title="الرصيد الكلي"
                                value={balance.toLocaleString()}
                                unit="ج.م"
                                icon={Wallet}
                                variant="primary"
                                subtitle="الصندوق والبنك والمحافظ والشيكات والتحويش"
                            />
                            <StatCard
                                title="رصيد التحويش"
                                value={Number(treasuryData?.tahweesh || 0).toLocaleString()}
                                unit="ج.م"
                                icon={PiggyBank}
                                variant="success"
                                subtitle="مبلغ مرصود — خارج مصاريف التشغيل"
                            />
                        </div>
                        <MethodBalancesCard
                            breakdown={treasuryData?.breakdown}
                            total={balance}
                            className="xl:col-span-2"
                        />
                    </div>
                )}
            </section>

            <section aria-label="أداء الفترة" className="space-y-3">
                <SectionHeading title="أداء الفترة" scope={periodLabel} />
                {isLoading ? (
                    <Skeleton className="h-64 rounded-3xl" />
                ) : (
                    <PeriodPerformanceCard
                        income={periodStats.income}
                        expense={periodStats.expense}
                        net={periodStats.net}
                        supplierPayments={periodStats.supplierPayments}
                        shopExpenses={periodStats.shopExpenses}
                        salesProfit={periodStats.salesProfit}
                        transactionCount={periodStats.transactionCount}
                    />
                )}
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <CashFlowChart data={cashFlowData} className="xl:col-span-2" />
                <DebtSnapshotCard totalDebt={periodStats.totalDebt} />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <SectionHeading title="سجل المعاملات" scope="سجل كامل — صفحات" />
                        {isTransactionsFetching && (
                            <span className="text-xs text-muted-foreground font-medium inline-flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" /> جاري التحديث…
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground font-medium">
                            ({totalTransactions.toLocaleString()} معاملة — صفحة {txPage} من {totalPages})
                        </span>
                    </div>
                </div>

                {isTransactionsError ? (
                    <Card className="p-8 border border-destructive/20 bg-destructive/5">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                            <div>
                                <h3 className="font-bold text-destructive">تعذر تحميل المعاملات</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {transactionsError?.message || 'حدث خطأ أثناء جلب البيانات'}
                                </p>
                            </div>
                            <Button onClick={refreshAll} variant="outline" className="gap-2">
                                <RefreshCcw className="h-4 w-4" /> إعادة المحاولة
                            </Button>
                        </div>
                    </Card>
                ) : allTransactions.length === 0 && !isTransactionsFetching ? (
                    <Card className="p-8 border-dashed">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <Wallet className="h-10 w-10 text-muted-foreground/40" />
                            <h3 className="font-bold">لا توجد معاملات في هذه الفترة</h3>
                            <p className="text-sm text-muted-foreground">
                                جرّب توسيع نطاق التاريخ أو أضف معاملة جديدة.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <TransactionsTable
                        transactions={filteredTransactions}
                        typeFilter={typeFilter}
                        onTypeFilterChange={handleTypeFilterChange}
                        onTxClick={handleTxClick}
                        onDelete={handleDelete}
                        isDeleting={isDeleting}
                        page={txPage}
                        totalPages={totalPages}
                        total={totalTransactions}
                        onPageChange={setTxPage}
                    />
                )}
            </div>

            <TransactionDetailsDialog
                transaction={selectedTx}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
            />

            {/* Print-only report (hidden on screen, rendered by the browser
                print engine with native Arabic shaping/bidi). It MUST stay a
                sibling of the print:hidden screen tree — a print:block child
                can never escape a display:none ancestor. */}
            <ConfirmDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                title="التراجع عن المعاملة"
                description="هل أنت متأكد من التراجع عن هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء."
                confirmLabel="تراجع"
                onConfirm={handleConfirmDelete}
            />
        </div>
        <TreasuryPrintView
            rows={printRows ?? []}
            summary={printSummary}
            periodLabel={periodLabel}
            dateRange={dateRange}
        />
        <DocumentPrintStyles />
        </>
    );
}

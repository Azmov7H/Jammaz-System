'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAccountingEntries } from '@/services/accountingService';
import {
    FileText, List, Layers,
    Briefcase, Download, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatisticsDashboard } from '@/components/accounting/StatisticsDashboard';
import { FiltersBar } from '@/components/accounting/FiltersBar';
import { JournalEntriesTab } from '@/components/accounting/JournalEntriesTab';
import { LedgerTab } from '@/components/accounting/LedgerTab';
import { TrialBalanceTab } from '@/components/accounting/TrialBalanceTab';
import { buildCsv, downloadCsv } from '@/lib/exportCsv';

const exportToCSV = (entries) => {
    const headers = ['رقم القيد', 'التاريخ', 'النوع', 'الوصف', 'الحساب المدين', 'الحساب الدائن', 'المبلغ'];
    const rows = entries.map(e => [
        e.entryNumber,
        format(new Date(e.date), 'yyyy-MM-dd'),
        e.type,
        e.description,
        e.debitAccount,
        e.creditAccount,
        e.amount
    ]);

    downloadCsv(`accounting-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`, buildCsv(rows, headers));
};

export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState('entries');
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        dateFrom: '',
        dateTo: ''
    });

    // Server-side filter query (type + date only — search is client-side)
    const serverFilters = useMemo(() => {
        const q = { limit: 500 };
        if (filters.type && filters.type !== 'all') q.type = filters.type;
        if (filters.dateFrom) q.startDate = filters.dateFrom;
        if (filters.dateTo) q.endDate = filters.dateTo;
        return q;
    }, [filters.type, filters.dateFrom, filters.dateTo]);

    const { data: allEntriesData, isLoading: isStatsLoading, isError: isStatsError, refetch: refetchStats, isFetching: isStatsFetching } = useQuery({
        queryKey: ['accounting-entries', serverFilters],
        queryFn: async ({ signal }) => {
            const res = await getAccountingEntries(serverFilters, { signal });
            // res is the unwrapped payload from api.get: { entries, total, page, limit }
            return { entries: res?.entries || [], total: res?.total || 0 };
        }
    });

    // Derive chart of accounts from the same query data (no extra round trip)
    const chartData = useMemo(() => {
        const accounts = new Set();
        (allEntriesData?.entries || []).forEach(e => {
            if (e.debitAccount) accounts.add(e.debitAccount);
            if (e.creditAccount) accounts.add(e.creditAccount);
        });
        return { chartOfAccounts: Array.from(accounts).sort() };
    }, [allEntriesData]);

    const resetFilters = useCallback(() => {
        setFilters({
            search: '',
            type: 'all',
            dateFrom: '',
            dateTo: ''
        });
    }, []);

    const handleExport = useCallback(() => {
        if (allEntriesData?.entries?.length) {
            exportToCSV(allEntriesData.entries);
        }
    }, [allEntriesData]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // / to focus search
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="ابحث"]');
                if (searchInput) searchInput.focus();
            }
            // Escape to clear filters
            if (e.key === 'Escape') {
                resetFilters();
                document.activeElement?.blur();
            }
            // Ctrl/Cmd + E to export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                handleExport();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [resetFilters, handleExport]);

    const isLoading = isStatsLoading;
    const isError = isStatsError;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            <PageHeader
                title="النظام المحاسبي الذكي"
                subtitle="مركز التحكم المالي والتقارير العامة للمنشأة"
                icon={Briefcase}
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => refetchStats()}
                            disabled={isStatsFetching}
                            className="h-14 px-6 rounded-2xl font-bold text-sm gap-2 glass-card border-white/10"
                            aria-label="تحديث البيانات"
                        >
                            <RefreshCw className={cn("w-4 h-4", isStatsFetching && "animate-spin")} />
                            تحديث
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={!allEntriesData?.entries?.length}
                            className="h-14 px-8 rounded-2xl font-bold text-lg gap-3 bg-success hover:bg-success text-white shadow-2xl shadow-success/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Download size={24} />
                            تصدير البيانات
                        </Button>
                    </div>
                }
            />

            {isError ? (
                <div className="glass-card rounded-[2rem] border border-destructive/30 p-12 text-center">
                    <p className="font-bold text-destructive text-lg mb-4">تعذّر تحميل البيانات المحاسبية</p>
                    <Button onClick={() => refetchStats()} className="gap-2">
                        <RefreshCw className="w-4 h-4" /> إعادة المحاولة
                    </Button>
                </div>
            ) : (
                <>
                    {/* Statistics Dashboard */}
                    <StatisticsDashboard
                        entries={allEntriesData?.entries || []}
                        isLoading={isLoading}
                    />

                    {/* Filters Bar */}
                    {activeTab === 'entries' && (
                        <FiltersBar
                            filters={filters}
                            setFilters={setFilters}
                            onReset={resetFilters}
                            onExport={handleExport}
                            totalEntries={allEntriesData?.entries?.length || 0}
                        />
                    )}

                    {/* Tab Navigation */}
                    <div className="flex p-1 bg-white/5 rounded-2xl w-full md:w-fit backdrop-blur-md border border-white/5">
                        {[
                            { id: 'entries', label: 'قيود اليومية', icon: List },
                            { id: 'ledger', label: 'دفتر الأستاذ', icon: FileText },
                            { id: 'trial-balance', label: 'ميزان المراجعة', icon: Layers },
                        ].map((tab) => (
                            <button type="button"
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300",
                                    activeTab === tab.id ? "text-white" : "text-muted-foreground hover:text-white"
                                )}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </span>
                                {activeTab === tab.id && (
                                    <div className="absolute inset-0 bg-primary shadow-lg shadow-primary/25 rounded-xl -z-10" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeTab === 'entries' && (
                            <JournalEntriesTab
                                filters={filters}
                                serverData={allEntriesData}
                                isLoading={isLoading}
                            />
                        )}
                        {activeTab === 'ledger' && (
                            <LedgerTab chartOfAccounts={chartData?.chartOfAccounts || []} />
                        )}
                        {activeTab === 'trial-balance' && <TrialBalanceTab />}
                    </div>
                </>
            )}
        </div >
    );
}

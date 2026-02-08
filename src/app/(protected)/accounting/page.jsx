'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import {
    Loader2, Calendar, FileText, BarChart3, List, Layers,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Search, Filter, CheckCircle2, AlertCircle, Building2,
    Briefcase, ClipboardList, Wallet, Download, X, ChevronDown,
    DollarSign, Receipt, Activity, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';

// Statistics Dashboard Component
const StatisticsDashboard = ({ entries = [] }) => {
    const stats = useMemo(() => {
        const totalDebit = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalCredit = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
        return {
            totalEntries: entries.length,
            totalDebit,
            totalCredit,
            isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
        };
    }, [entries]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="إجمالي القيود"
                value={stats.totalEntries}
                icon={Receipt}
                variant="primary"
                subtitle="عمليات مسجلة"
            />
            <StatCard
                title="إجمالي المدين"
                value={stats.totalDebit.toLocaleString()}
                unit="ج.م"
                icon={ArrowUpRight}
                variant="info"
                subtitle="أرصدة مدينة"
            />
            <StatCard
                title="إجمالي الدائن"
                value={stats.totalCredit.toLocaleString()}
                unit="ج.م"
                icon={ArrowDownRight}
                variant="success"
                subtitle="أرصدة دائنة"
            />
            <StatCard
                title="حالة التوازن"
                value={stats.isBalanced ? 'متوازن' : 'غير متوازن'}
                icon={stats.isBalanced ? CheckCircle2 : AlertCircle}
                variant={stats.isBalanced ? 'success' : 'destructive'}
                subtitle={stats.isBalanced ? "ميزان مطابق" : "ميزان غير مطابق"}
            />
        </div>
    );
};

// Export function
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

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `accounting-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
};

// Filters Bar Component
const FiltersBar = ({ filters, setFilters, onReset, onExport, totalEntries }) => {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="flex-1 relative group w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="ابحث في الوصف أو رقم القيد..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="pr-12 h-14 glass-card border-white/5 rounded-2xl focus-visible:ring-primary/20 bg-white/[0.02]"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "h-14 px-6 rounded-2xl font-black text-sm glass-card border-white/10 transition-all",
                            showFilters && "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        )}
                    >
                        <Filter className="w-4 h-4 ml-2" />
                        تصفية
                    </Button>

                    <Button
                        onClick={onExport}
                        className="h-14 px-6 rounded-2xl font-black text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 gap-2"
                    >
                        <Download className="w-4 h-4" />
                        تصدير ({totalEntries})
                    </Button>

                    {(filters.search || filters.type || filters.dateFrom || filters.dateTo) && (
                        <Button
                            variant="ghost"
                            onClick={onReset}
                            className="h-14 px-4 rounded-2xl font-black text-sm text-rose-500 hover:bg-rose-500/10"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Entry Type Filter */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground mb-2 block">نوع القيد</label>
                            <Select value={filters.type} onValueChange={(val) => setFilters({ ...filters, type: val })}>
                                <SelectTrigger className="h-10 bg-white/5 border-white/10">
                                    <SelectValue placeholder="جميع الأنواع" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">جميع الأنواع</SelectItem>
                                    <SelectItem value="SALE">مبيعات</SelectItem>
                                    <SelectItem value="PURCHASE">مشتريات</SelectItem>
                                    <SelectItem value="PAYMENT">دفع</SelectItem>
                                    <SelectItem value="ADJUSTMENT">تسوية</SelectItem>
                                    <SelectItem value="EXPENSE">مصروف</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground mb-2 block">من تاريخ</label>
                            <Input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="h-10 bg-white/5 border-white/10"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground mb-2 block">إلى تاريخ</label>
                            <Input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="h-10 bg-white/5 border-white/10"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Enhanced Journal Entries Tab
const JournalEntriesTab = ({ filters }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const { data, isLoading } = useQuery({
        queryKey: ['accounting-entries', filters],
        queryFn: async () => {
            const res = await api.get('/api/accounting/entries?limit=500');
            return { entries: res.data || [] };
        }
    });

    const filteredEntries = useMemo(() => {
        if (!data?.entries) return [];
        return data.entries.filter(entry => {
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                if (!entry.description?.toLowerCase().includes(searchLower) &&
                    !entry.entryNumber?.toString().includes(searchLower)) return false;
            }
            if (filters.type && filters.type !== 'all' && entry.type !== filters.type) return false;
            if (filters.dateFrom && new Date(entry.date) < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && new Date(entry.date) > new Date(filters.dateTo)) return false;
            return true;
        });
    }, [data?.entries, filters]);

    const totalPages = Math.ceil(filteredEntries.length / pageSize);
    const paginatedEntries = useMemo(() => {
        return filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredEntries, currentPage, pageSize]);

    const paginatedGroupedEntries = useMemo(() => {
        const groups = {};
        paginatedEntries.forEach(entry => {
            const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(entry);
        });
        return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    }, [paginatedEntries]);

    if (isLoading) return <div className="p-32 flex justify-center"><Loader2 className="animate-spin text-primary w-12 h-12 opacity-20" /></div>;

    if (filteredEntries.length === 0) {
        return (
            <div className="text-center p-24 glass-card rounded-[3rem] border-dashed border border-white/10">
                <Activity className="w-20 h-20 mx-auto mb-6 text-muted-foreground/10" />
                <h3 className="font-black text-2xl text-white/20 mb-2 uppercase tracking-widest">لا توجد قيود حالياً</h3>
                <p className="text-sm text-white/5 font-bold uppercase tracking-widest">تحقق من معايير البحث أو التاريخ</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card px-8 py-4 rounded-3xl border border-white/5 shadow-xl">
                <div className="flex items-center gap-4 text-xs font-black text-muted-foreground uppercase tracking-widest">
                    <span>المعروض: {paginatedEntries.length} قيد من {filteredEntries.length}</span>
                    <div className="h-4 w-px bg-white/10" />
                    <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                        <SelectTrigger className="h-8 w-20 bg-white/5 border-none font-black text-[10px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10">
                            {[10, 20, 50, 100].map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 rounded-xl"
                    >
                        <ChevronRight />
                    </Button>
                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let p = i + 1;
                            if (totalPages > 5 && currentPage > 3) p = currentPage - 2 + i;
                            if (p > totalPages) return null;
                            return (
                                <Button
                                    key={i}
                                    variant={currentPage === p ? "default" : "ghost"}
                                    onClick={() => setCurrentPage(p)}
                                    className={cn("w-10 h-10 rounded-xl font-black transition-all", currentPage === p && "shadow-lg shadow-primary/20")}
                                >
                                    {p}
                                </Button>
                            )
                        })}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 rounded-xl"
                    >
                        <ChevronLeft />
                    </Button>
                </div>
            </div>

            {paginatedGroupedEntries.map(([date, entries]) => (
                <div key={date} className="space-y-4">
                    <div className="flex items-center gap-4 px-4 group">
                        <div className="flex items-center gap-3 px-6 py-2 glass-card rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-black text-xs uppercase tracking-widest">
                                {format(new Date(date), 'dd MMMM yyyy', { locale: ar })}
                            </span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-white/10 text-[10px] font-black opacity-30 group-hover:opacity-100 transition-opacity">
                            {entries.length} عمليات
                        </Badge>
                    </div>

                    <div className="grid gap-4">
                        {entries.map((entry, i) => (
                            <div
                                key={entry._id}
                                className="glass-card hover:bg-white/[0.04] p-6 rounded-[2.5rem] border border-white/5 transition-all duration-500 group shadow-xl"
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 font-black text-xs text-white/20 group-hover:text-primary group-hover:border-primary/30 transition-all">
                                        #{entry.entryNumber}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase tracking-widest px-3 py-1">
                                                {entry.type}
                                            </Badge>
                                            <h4 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors truncate">{entry.description}</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-x-8 gap-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                <span className="text-xs font-bold text-white/40 tracking-tight">{entry.debitAccount}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-xs font-bold text-white/40 tracking-tight">{entry.creditAccount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-6 pl-6 border-r border-white/5">
                                        <div className="text-right">
                                            <div className="text-2xl font-black tracking-tighter tabular-nums">{entry.amount.toLocaleString()}</div>
                                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest opacity-50">EGP</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Ledger Tab (keeping original with minor enhancements)
const LedgerTab = ({ chartOfAccounts }) => {
    const [selectedAccount, setSelectedAccount] = useState('');

    if (!selectedAccount && chartOfAccounts?.length > 0) {
        const cashAcc = chartOfAccounts.find(a => a.includes('خزينة'));
        if (cashAcc) setSelectedAccount(cashAcc);
        else setSelectedAccount(chartOfAccounts[0]);
    }

    const { data: ledger, isLoading } = useQuery({
        queryKey: ['ledger', selectedAccount],
        queryFn: async () => {
            if (!selectedAccount) return null;
            const res = await api.get(`/api/accounting/ledger?account=${encodeURIComponent(selectedAccount)}`);
            return { ledger: res.data };
        },
        enabled: !!selectedAccount
    });

    return (
        <div className="space-y-6">
            <div className="glass-card p-2 rounded-[1.5rem] border border-white/10 bg-black/20">
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="h-14 border-none bg-transparent text-lg font-bold">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <SelectValue placeholder="اختر الحساب..." />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <ScrollArea className="h-full">
                            {chartOfAccounts?.map((account) => (
                                <SelectItem key={account} value={account} className="font-medium text-right" dir="rtl">{account}</SelectItem>
                            ))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
            ) : ledger?.ledger ? (
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -translate-x-10 -translate-y-10" />
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold text-primary/80 mb-1">الرصيد النهائي للحساب</p>
                                <h3 className="text-4xl font-black">{ledger.ledger.finalBalance.toLocaleString()}</h3>
                            </div>
                            <div className="p-4 bg-primary/20 rounded-2xl text-primary backdrop-blur-md">
                                <Wallet className="h-8 w-8" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {ledger.ledger.entries.map((item, i) => (
                            <div
                                key={item._id}
                                className="glass-card p-4 rounded-[1.25rem] border border-white/5 hover:bg-white/5 flex items-center justify-between group animate-in fade-in slide-in-from-right-2 duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/5 shrink-0">
                                        <span className="text-xs font-bold text-muted-foreground">{format(new Date(item.date), 'dd')}</span>
                                        <span className="text-[10px] uppercase text-muted-foreground/60">{format(new Date(item.date), 'MMM')}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm mb-0.5">{item.description}</p>
                                        <div className="flex items-center gap-3 text-xs font-medium">
                                            {item.debit > 0 && <span className="text-blue-400">مدين: {item.debit.toLocaleString()}</span>}
                                            {item.credit > 0 && <span className="text-emerald-400">دائن: {item.credit.toLocaleString()}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left pl-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-50 mb-0.5">الرصيد</p>
                                    <p className="font-mono font-bold text-lg">{item.balance.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center p-12 glass-card rounded-[2rem] border-dashed border-2 border-white/10">
                    <p className="font-bold text-muted-foreground">اختر حساباً لعرض دفتر الأستاذ</p>
                </div>
            )}
        </div>
    );
};

// Trial Balance Tab (keeping original)
const TrialBalanceTab = () => {
    const { data: trialBalance, isLoading } = useQuery({
        queryKey: ['trial-balance'],
        queryFn: async () => {
            const res = await api.get('/api/accounting/trial-balance');
            return { trialBalance: res.data };
        }
    });

    if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

    const data = trialBalance?.trialBalance;

    return (
        <div className="space-y-6">
            <div className={cn(
                "glass-card p-6 rounded-[2rem] border relative overflow-hidden flex items-center justify-between",
                data?.isBalanced ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
            )}>
                <div className="relative z-10 flex items-center gap-4">
                    <div className={cn("p-3 rounded-2xl", data?.isBalanced ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500")}>
                        {data?.isBalanced ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
                    </div>
                    <div>
                        <h3 className={cn("text-xl font-black", data?.isBalanced ? "text-emerald-500" : "text-red-500")}>
                            {data?.isBalanced ? "ميزان المراجعة متوازن" : "تحذير: الميزان غير متوازن"}
                        </h3>
                        <p className="text-sm font-medium opacity-80">
                            {data?.isBalanced
                                ? "جميع الحسابات مطابقة والعمليات المحاسبية صحيحة."
                                : "يوجد فرق بين إجمالي المدين والدائن، يرجى المراجعة."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden rounded-[2rem] border border-white/5">
                <div className="grid grid-cols-4 bg-white/5 p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
                    <div className="text-right pr-4">اسم الحساب</div>
                    <div>مدين</div>
                    <div>دائن</div>
                    <div>الرصيد</div>
                </div>
                <div className="divide-y divide-white/5">
                    {data?.accounts?.map((acc) => (
                        <div key={acc.account} className="grid grid-cols-4 p-4 hover:bg-white/5 transition-colors items-center text-center">
                            <div className="text-right font-bold pr-4 truncate" title={acc.account}>{acc.account}</div>
                            <div className="font-mono text-sm text-blue-400/80">{acc.debit > 0 ? acc.debit.toLocaleString() : '-'}</div>
                            <div className="font-mono text-sm text-emerald-400/80">{acc.credit > 0 ? acc.credit.toLocaleString() : '-'}</div>
                            <div className={cn("font-mono font-bold text-sm", acc.balance > 0 ? "text-blue-400" : acc.balance < 0 ? "text-emerald-400" : "text-muted-foreground")}>
                                {Math.abs(acc.balance).toLocaleString()} {acc.balance !== 0 && (acc.balance > 0 ? 'M' : 'D')}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-4 bg-white/5 p-4 font-black text-sm text-center border-t border-white/10">
                    <div className="text-right pr-4">الإجمالي</div>
                    <div className="font-mono text-blue-400">{data?.totalDebit.toLocaleString()}</div>
                    <div className="font-mono text-emerald-400">{data?.totalCredit.toLocaleString()}</div>
                    <div></div>
                </div>
            </div>
        </div>
    );
};

// Main Component
export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState('entries');
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        dateFrom: '',
        dateTo: ''
    });

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
    }, [filters]);

    const { data: allEntriesData } = useQuery({
        queryKey: ['accounting-entries-stats'],
        queryFn: async () => {
            const res = await api.get('/api/accounting/entries?limit=500');
            return { entries: res.data || [] };
        }
    });

    // Get chart of accounts
    const { data: chartData } = useQuery({
        queryKey: ['chart-of-accounts'],
        queryFn: async () => {
            const res = await api.get('/api/accounting/entries?limit=500');
            const entries = res.data || [];
            const accounts = new Set();
            entries.forEach(e => {
                if (e.debitAccount) accounts.add(e.debitAccount);
                if (e.creditAccount) accounts.add(e.creditAccount);
            });
            return { chartOfAccounts: Array.from(accounts) };
        }
    });

    const resetFilters = () => {
        setFilters({
            search: '',
            type: 'all',
            dateFrom: '',
            dateTo: ''
        });
    };

    const handleExport = () => {
        if (allEntriesData?.entries) {
            exportToCSV(allEntriesData.entries);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            {/* Header Section */}
            <PageHeader
                title="النظام المحاسبي الذكي"
                subtitle="مركز التحكم المالي والتقارير العامة للمنشأة"
                icon={Briefcase}
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleExport}
                            className="h-14 px-8 rounded-2xl font-black text-lg gap-3 bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/20"
                        >
                            <Download size={24} />
                            تصدير البيانات
                        </Button>
                    </div>
                }
            />

            {/* Statistics Dashboard */}
            <StatisticsDashboard entries={allEntriesData?.entries || []} />

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
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "relative px-6 py-3 rounded-xl font-black text-sm transition-all duration-300",
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
                {activeTab === 'entries' && <JournalEntriesTab filters={filters} />}
                {activeTab === 'ledger' && <LedgerTab chartOfAccounts={chartData?.chartOfAccounts || []} />}
                {activeTab === 'trial-balance' && <TrialBalanceTab />}
            </div>
        </div >
    );
}

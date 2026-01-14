'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, Calendar, FileText, BarChart3, List, Layers,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Search, Filter, CheckCircle2, AlertCircle, Building2,
    Briefcase, ClipboardList, Wallet, Download, X, ChevronDown,
    DollarSign, Receipt, Activity, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Statistics Dashboard Component
const StatisticsDashboard = ({ entries = [] }) => {
    const stats = useMemo(() => {
        const totalDebit = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalCredit = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
        const entryTypes = {};
        entries.forEach(e => {
            entryTypes[e.type] = (entryTypes[e.type] || 0) + 1;
        });

        return {
            totalEntries: entries.length,
            totalDebit,
            totalCredit,
            entryTypes,
            isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
        };
    }, [entries]);

    const statCards = [
        {
            title: 'إجمالي القيود',
            value: stats.totalEntries,
            icon: Receipt,
            color: 'from-blue-500/20 to-blue-500/5',
            iconColor: 'text-blue-500',
            borderColor: 'border-blue-500/20'
        },
        {
            title: 'إجمالي المدين',
            value: stats.totalDebit.toLocaleString(),
            suffix: 'EGP',
            icon: ArrowUpRight,
            color: 'from-purple-500/20 to-purple-500/5',
            iconColor: 'text-purple-500',
            borderColor: 'border-purple-500/20'
        },
        {
            title: 'إجمالي الدائن',
            value: stats.totalCredit.toLocaleString(),
            suffix: 'EGP',
            icon: ArrowDownRight,
            color: 'from-emerald-500/20 to-emerald-500/5',
            iconColor: 'text-emerald-500',
            borderColor: 'border-emerald-500/20'
        },
        {
            title: 'حالة التوازن',
            value: stats.isBalanced ? 'متوازن' : 'غير متوازن',
            icon: stats.isBalanced ? CheckCircle2 : AlertCircle,
            color: stats.isBalanced ? 'from-green-500/20 to-green-500/5' : 'from-red-500/20 to-red-500/5',
            iconColor: stats.isBalanced ? 'text-green-500' : 'text-red-500',
            borderColor: stats.isBalanced ? 'border-green-500/20' : 'border-red-500/20'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
                <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                        "glass-card p-6 rounded-[1.5rem] border relative overflow-hidden",
                        `bg-gradient-to-br ${stat.color}`,
                        stat.borderColor
                    )}
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full translate-x-8 -translate-y-8" />
                    <div className="relative z-10 flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                {stat.title}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
                                {stat.suffix && (
                                    <span className="text-xs font-bold text-muted-foreground opacity-50">
                                        {stat.suffix}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={cn("p-3 rounded-xl bg-white/10 backdrop-blur-sm", stat.iconColor)}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                </motion.div>
            ))}
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
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="ابحث في الوصف أو رقم القيد..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="pr-11 h-12 bg-white/5 border-white/10 rounded-xl"
                    />
                </div>

                {/* Toggle Advanced Filters */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-6 h-12 rounded-xl font-bold text-sm transition-all border",
                        showFilters
                            ? "bg-primary text-white border-primary"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                >
                    <Filter className="w-4 h-4" />
                    فلاتر متقدمة
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
                </button>

                {/* Export Button */}
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-6 h-12 rounded-xl font-bold text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all"
                >
                    <Download className="w-4 h-4" />
                    تصدير ({totalEntries})
                </button>

                {/* Reset Filters */}
                {(filters.search || filters.type || filters.dateFrom || filters.dateTo) && (
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 px-6 h-12 rounded-xl font-bold text-sm bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                    >
                        <X className="w-4 h-4" />
                        إعادة تعيين
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-4 rounded-xl border border-white/10 bg-white/5"
                    >
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
                    </motion.div>
                )}
            </AnimatePresence>
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
            const res = await fetch('/api/accounting/entries?limit=500');
            const json = await res.json();
            return { entries: json.data || [] };
        }
    });

    // Apply filters
    const filteredEntries = useMemo(() => {
        if (!data?.entries) return [];

        return data.entries.filter(entry => {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSearch =
                    entry.description?.toLowerCase().includes(searchLower) ||
                    entry.entryNumber?.toString().includes(searchLower) ||
                    entry.debitAccount?.toLowerCase().includes(searchLower) ||
                    entry.creditAccount?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Type filter
            if (filters.type && filters.type !== 'all') {
                if (entry.type !== filters.type) return false;
            }

            // Date filters
            if (filters.dateFrom) {
                if (new Date(entry.date) < new Date(filters.dateFrom)) return false;
            }
            if (filters.dateTo) {
                if (new Date(entry.date) > new Date(filters.dateTo)) return false;
            }

            return true;
        });
    }, [data?.entries, filters]);

    // Group by date
    const groupedEntries = useMemo(() => {
        const groups = {};
        filteredEntries.forEach(entry => {
            const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(entry);
        });
        return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    }, [filteredEntries]);

    // Pagination
    const totalPages = Math.ceil(filteredEntries.length / pageSize);
    const paginatedEntries = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredEntries.slice(start, end);
    }, [filteredEntries, currentPage, pageSize]);

    const paginatedGroupedEntries = useMemo(() => {
        const groups = {};
        paginatedEntries.forEach(entry => {
            const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(entry);
        });
        return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    }, [paginatedEntries]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

    if (filteredEntries.length === 0) {
        return (
            <div className="text-center p-12 glass-card rounded-[2rem] border-dashed border-2 border-white/10">
                <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-bold text-lg mb-2">لا توجد قيود</h3>
                <p className="text-sm text-muted-foreground">لم يتم العثور على قيود تطابق معايير البحث</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Pagination Controls */}
            {filteredEntries.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                            عرض {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredEntries.length)} من {filteredEntries.length}
                        </span>
                        <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                            <SelectTrigger className="h-9 w-[100px] bg-white/5 border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={cn(
                                "p-2 rounded-lg border transition-all",
                                currentPage === 1
                                    ? "bg-white/5 border-white/5 text-muted-foreground/50 cursor-not-allowed"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-foreground"
                            )}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={cn(
                                            "w-9 h-9 rounded-lg font-bold text-sm transition-all",
                                            currentPage === pageNum
                                                ? "bg-primary text-white"
                                                : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                                        )}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={cn(
                                "p-2 rounded-lg border transition-all",
                                currentPage === totalPages
                                    ? "bg-white/5 border-white/5 text-muted-foreground/50 cursor-not-allowed"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-foreground"
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {paginatedGroupedEntries.map(([date, entries]) => (
                <div key={date} className="space-y-3">
                    {/* Date Header */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm">
                                {format(new Date(date), 'dd MMMM yyyy', { locale: ar })}
                            </span>
                        </div>
                        <div className="h-px flex-1 bg-white/5" />
                        <Badge variant="outline" className="bg-white/5 border-white/10">
                            {entries.length} قيد
                        </Badge>
                    </div>

                    {/* Entries */}
                    <div className="grid gap-3">
                        <AnimatePresence mode="popLayout">
                            {entries.map((entry, i) => (
                                <motion.div
                                    key={entry._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="glass-card p-4 rounded-[1.5rem] border border-white/5 hover:bg-white/5 transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* ID */}
                                        <div className="flex items-center gap-3 min-w-[100px]">
                                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-muted-foreground font-mono font-bold text-xs">
                                                #{entry.entryNumber}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[10px] h-5 bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground">
                                                    {entry.type}
                                                </Badge>
                                                <h4 className="font-bold text-sm truncate" title={entry.description}>{entry.description}</h4>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs font-medium text-muted-foreground/80">
                                                <span className="flex items-center gap-1.5 overflow-hidden">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    <span className="truncate">{entry.debitAccount}</span>
                                                </span>
                                                <span className="flex items-center gap-1.5 overflow-hidden">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="truncate">{entry.creditAccount}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="flex items-center justify-end gap-3 min-w-[120px] pl-2 border-l border-white/5">
                                            <div className="text-right">
                                                <div className="text-lg font-black font-mono tracking-tight">{entry.amount.toLocaleString()}</div>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">EGP</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
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
            const res = await fetch(`/api/accounting/ledger?account=${encodeURIComponent(selectedAccount)}`);
            const json = await res.json();
            return { ledger: json.data };
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
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className="glass-card p-4 rounded-[1.25rem] border border-white/5 hover:bg-white/5 flex items-center justify-between group"
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
                            </motion.div>
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
            const res = await fetch('/api/accounting/trial-balance');
            const json = await res.json();
            return { trialBalance: json.data };
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

    // Get all entries for statistics
    const { data: allEntriesData } = useQuery({
        queryKey: ['accounting-entries-stats'],
        queryFn: async () => {
            const res = await fetch('/api/accounting/entries?limit=500');
            const json = await res.json();
            return { entries: json.data || [] };
        }
    });

    // Get chart of accounts
    const { data: chartData } = useQuery({
        queryKey: ['chart-of-accounts'],
        queryFn: async () => {
            const res = await fetch('/api/accounting/entries?limit=500');
            const json = await res.json();
            const entries = json.data || [];
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
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-6" dir="rtl">
            {/* Header */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-2xl">
                        <Briefcase className="h-8 w-8 text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">النظام المحاسبي</h1>
                        <p className="text-muted-foreground font-medium">مركز التحكم المالي والتقارير</p>
                    </div>
                </div>
            </motion.div>

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
                            "relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all flex-1 md:flex-none",
                            activeTab === tab.id ? "text-white" : "text-muted-foreground hover:text-white/80"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-primary shadow-lg shadow-primary/25 rounded-xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {activeTab === 'entries' && <JournalEntriesTab filters={filters} />}
                {activeTab === 'ledger' && <LedgerTab chartOfAccounts={chartData?.chartOfAccounts || []} />}
                {activeTab === 'trial-balance' && <TrialBalanceTab />}
            </motion.div>
        </div>
    );
}

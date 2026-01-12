'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, Calendar, FileText, BarChart3, List, Layers,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Search, Filter, CheckCircle2, AlertCircle, Building2,
    Briefcase, ClipboardList, Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Components for different tabs
const JournalEntriesTab = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['accounting-entries'],
        queryFn: async () => {
            const res = await fetch('/api/accounting/entries?limit=50');
            const json = await res.json();
            return { entries: json.data || [] };
        }
    });

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

    return (
        <div className="space-y-4">
            <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                    {data?.entries?.map((entry, i) => (
                        <motion.div
                            key={entry._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="glass-card p-4 rounded-[1.5rem] border border-white/5 hover:bg-white/5 transition-all group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Date & ID */}
                                <div className="flex items-center gap-3 min-w-[140px]">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-muted-foreground font-mono font-bold text-xs">
                                        #{entry.entryNumber}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-muted-foreground">{format(new Date(entry.date), 'dd/MM/yyyy')}</span>
                                        <span className="text-[10px] text-muted-foreground/60">{format(new Date(entry.date), 'hh:mm a')}</span>
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
    );
};

const LedgerTab = ({ chartOfAccounts }) => {
    const [selectedAccount, setSelectedAccount] = useState('');

    // Auto-select
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
                    {/* Account Summary Card */}
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
            {/* Balance Status */}
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

export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState('entries');

    // Get chart of accounts first
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

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-6" dir="rtl">
            {/* Header & Overview */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
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
            </div>

            {/* Custom Navigation Pills */}
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
                {activeTab === 'entries' && <JournalEntriesTab />}
                {activeTab === 'ledger' && <LedgerTab chartOfAccounts={chartData?.chartOfAccounts || []} />}
                {activeTab === 'trial-balance' && <TrialBalanceTab />}
            </motion.div>
        </div>
    );
}

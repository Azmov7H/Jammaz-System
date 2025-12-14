'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, FileText, BarChart3, List, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Components for different tabs
const JournalEntriesTab = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['accounting-entries'],
        queryFn: async () => {
            const res = await fetch('/api/accounting/entries?limit=50');
            return res.json();
        }
    });

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">قيود اليومية العامة</h2>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>رقم القيد</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>النوع</TableHead>
                            <TableHead>البيان</TableHead>
                            <TableHead>مدين (من حساب)</TableHead>
                            <TableHead>دائن (إلى حساب)</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>بواسطة</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.entries?.map((entry) => (
                            <TableRow key={entry._id}>
                                <TableCell className="font-mono text-xs">{entry.entryNumber}</TableCell>
                                <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                <TableCell><Badge variant="outline">{entry.type}</Badge></TableCell>
                                <TableCell className="max-w-[200px] truncate" title={entry.description}>{entry.description}</TableCell>
                                <TableCell className="text-blue-600">{entry.debitAccount}</TableCell>
                                <TableCell className="text-green-600">{entry.creditAccount}</TableCell>
                                <TableCell className="font-bold">{entry.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{entry.createdBy?.name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

const LedgerTab = ({ chartOfAccounts }) => {
    const [selectedAccount, setSelectedAccount] = useState('');

    // Auto-select first cash account if available
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
            return res.json();
        },
        enabled: !!selectedAccount
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-[300px]">
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر الحساب..." />
                        </SelectTrigger>
                        <SelectContent>
                            {chartOfAccounts?.map((account) => (
                                <SelectItem key={account} value={account}>{account}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : ledger?.ledger ? (
                <div className="border rounded-md">
                    <div className="bg-muted p-4 border-b flex justify-between items-center">
                        <h3 className="font-bold">{ledger.ledger.account}</h3>
                        <div className="text-lg font-bold">
                            الرصيد الحالي: <span dir="ltr">{ledger.ledger.finalBalance.toLocaleString()}</span>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>البيان</TableHead>
                                <TableHead>مدين</TableHead>
                                <TableHead>دائن</TableHead>
                                <TableHead>الرصيد</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ledger.ledger.entries.map((item) => (
                                <TableRow key={item._id}>
                                    <TableCell>{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell className="text-blue-600 font-medium">
                                        {item.debit > 0 ? item.debit.toLocaleString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-green-600 font-medium">
                                        {item.credit > 0 ? item.credit.toLocaleString() : '-'}
                                    </TableCell>
                                    <TableCell dir="ltr" className="font-bold bg-muted/20">
                                        {item.balance.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center p-10 text-muted-foreground">اختر حساباً لعرض دفتر الأستاذ</div>
            )}
        </div>
    );
};

const TrialBalanceTab = () => {
    const { data: trialBalance, isLoading } = useQuery({
        queryKey: ['trial-balance'],
        queryFn: async () => {
            const res = await fetch('/api/accounting/trial-balance');
            return res.json();
        }
    });

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const data = trialBalance?.trialBalance;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">ميزان المراجعة</h2>
                <Badge variant={data?.isBalanced ? "success" : "destructive"} className="text-sm px-4 py-1">
                    {data?.isBalanced ? "متوازن ✅" : "غير متوازن ❌"}
                </Badge>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">اسم الحساب</TableHead>
                            <TableHead className="text-right">مدين</TableHead>
                            <TableHead className="text-right">دائن</TableHead>
                            <TableHead className="text-right">الرصيد</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.accounts?.map((acc) => (
                            <TableRow key={acc.account}>
                                <TableCell className="font-medium">{acc.account}</TableCell>
                                <TableCell dir="ltr" className="text-right text-muted-foreground">{acc.debit > 0 ? acc.debit.toLocaleString() : '-'}</TableCell>
                                <TableCell dir="ltr" className="text-right text-muted-foreground">{acc.credit > 0 ? acc.credit.toLocaleString() : '-'}</TableCell>
                                <TableCell dir="ltr" className="text-right font-bold">
                                    {Math.abs(acc.balance).toLocaleString()} {acc.balance > 0 ? '(مدين)' : acc.balance < 0 ? '(دائن)' : ''}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <tfoot className="bg-muted font-bold text-lg">
                        <TableRow>
                            <TableCell>الإجمالي</TableCell>
                            <TableCell dir="ltr" className="text-right text-blue-700">{data?.totalDebit.toLocaleString()}</TableCell>
                            <TableCell dir="ltr" className="text-right text-green-700">{data?.totalCredit.toLocaleString()}</TableCell>
                            <TableCell className="text-right"></TableCell>
                        </TableRow>
                    </tfoot>
                </Table>
            </div>
        </div>
    );
};

export default function AccountingPage() {
    // Get chart of accounts first
    const { data: chartData } = useQuery({
        queryKey: ['chart-of-accounts'],
        queryFn: async () => {
            const res = await fetch('/api/accounting/entries?limit=1');
            return res.json();
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">المحاسبة العامة</h1>
                <p className="text-muted-foreground mt-2">
                    دفتر القيود، الأستاذ العام، وميزان المراجعة
                </p>
            </div>

            <Tabs defaultValue="entries" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="entries" className="flex gap-2"><List className="w-4 h-4" /> قيود اليومية</TabsTrigger>
                    <TabsTrigger value="ledger" className="flex gap-2"><FileText className="w-4 h-4" /> دفتر الأستاذ</TabsTrigger>
                    <TabsTrigger value="trial-balance" className="flex gap-2"><Layers className="w-4 h-4" /> ميزان المراجعة</TabsTrigger>
                </TabsList>

                <Card>
                    <CardContent className="pt-6">
                        <TabsContent value="entries">
                            <JournalEntriesTab />
                        </TabsContent>
                        <TabsContent value="ledger">
                            <LedgerTab chartOfAccounts={chartData?.chartOfAccounts || []} />
                        </TabsContent>
                        <TabsContent value="trial-balance">
                            <TrialBalanceTab />
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useTreasury, useAddTransaction, useDeleteTransaction } from '@/hooks/useFinancial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, Minus, Loader2, Trash2, Info, User, Clock, Tag, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import Link from "next/link"
import { ar } from 'date-fns/locale';

export default function FinancialPage() {
    const [period, setPeriod] = useState('TODAY'); // TODAY, MONTH, YEAR, CUSTOM
    const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, INCOME, EXPENSE
    const [customDates, setCustomDates] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const { data: treasuryData, isLoading } = useTreasury(getDateRange());
    const { mutate: addTransaction, isPending } = useAddTransaction();
    const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [formData, setFormData] = useState({ amount: '', description: '', type: 'INCOME' });

    // Calculate actual dates based on period
    function getDateRange() {
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

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    }

    const handleSubmit = () => {
        if (!formData.amount || !formData.description) return;
        addTransaction(formData, {
            onSuccess: () => {
                setIsDialogOpen(false);
                setFormData({ amount: '', description: '', type: 'INCOME' });
            }
        });
    };

    const handleDelete = (id) => {
        if (window.confirm('هل أنت متأكد من التراجع عن هذه المعاملة؟')) {
            deleteTransaction(id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const balance = treasuryData?.balance || 0;
    const allTransactions = treasuryData?.transactions || [];

    const handleTxClick = (tx) => {
        setSelectedTx(tx);
        setIsDetailsOpen(true);
    };

    // Client-side filtering
    const filteredTransactions = allTransactions.filter(tx =>
        typeFilter === 'ALL' || tx.type === typeFilter
    );

    const periodStats = {
        income: treasuryData?.totalIncome || 0,
        expense: treasuryData?.totalExpense || 0,
        net: treasuryData?.periodBalance || 0
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Wallet className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">الخزينة (النظام المالي)</h1>
                </div>

                {/* Period Filter */}
                <div className="flex flex-wrap items-center gap-2 bg-muted p-1 rounded-lg">
                    <Button
                        variant={period === 'TODAY' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPeriod('TODAY')}
                        className="text-xs h-8"
                    >اليوم</Button>
                    <Button
                        variant={period === 'MONTH' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPeriod('MONTH')}
                        className="text-xs h-8"
                    >هذا الشهر</Button>
                    <Button
                        variant={period === 'YEAR' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPeriod('YEAR')}
                        className="text-xs h-8"
                    >هذه السنة</Button>
                    <Button
                        variant={period === 'CUSTOM' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPeriod('CUSTOM')}
                        className="text-xs h-8"
                    >مخصص</Button>
                </div>
            </div>

            {/* Custom Date Range Picker (Visible only if filter is CUSTOM) */}
            {period === 'CUSTOM' && (
                <Card className="p-4 bg-muted/30 border-dashed">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs">من تاريخ</Label>
                            <Input
                                type="date"
                                className="h-9 w-40"
                                value={customDates.startDate}
                                onChange={e => setCustomDates({ ...customDates, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">إلى تاريخ</Label>
                            <Input
                                type="date"
                                className="h-9 w-40"
                                value={customDates.endDate}
                                onChange={e => setCustomDates({ ...customDates, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* Balance and Period Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Balance Card */}
                <Card className="bg-primary text-primary-foreground border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm opacity-90">الرصيد الكلي</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{balance.toLocaleString()} ج.م</div>
                    </CardContent>
                </Card>

                {/* Period Income */}
                <Card className="border-none shadow-sm bg-green-50 dark:bg-green-950/20">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-green-600 dark:text-green-400">إيرادات الفترة</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold text-green-700 dark:text-green-400">
                            +{periodStats.income.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>

                {/* Period Expense */}
                <Card className="border-none shadow-sm bg-red-50 dark:bg-red-950/20">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-red-600 dark:text-red-400">مصروفات الفترة</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold text-red-700 dark:text-red-400">
                            -{periodStats.expense.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>

                {/* Period Net */}
                <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-950/20">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-blue-600 dark:text-blue-400">صافي الفترة</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className={`text-xl font-bold ${periodStats.net >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>
                            {periodStats.net.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Buttons and Table */}
            <div className="grid grid-cols-1 gap-6">
                <div className="flex gap-4">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                            >
                                <Plus size={18} />
                                <span>إيداع / وارد</span>
                            </Button>
                        </DialogTrigger>
                        <DialogTrigger asChild>
                            <Button
                                className="flex-1 gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                            >
                                <Minus size={18} />
                                <span>مصروف / صادر</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                            <DialogHeader>
                                <DialogTitle>
                                    {formData.type === 'INCOME' ? 'إيداع نقدي / إضافة رصيد' : 'تسجيل مصروف خارجي'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label>المبلغ (ج.م)</Label>
                                    <Input
                                        type="number"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <Label>الوصف / السبب</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder={formData.type === 'INCOME' ? 'مثال: رأس مال إضافي' : 'مثال: فاتورة كهرباء'}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                                <Button
                                    onClick={handleSubmit}
                                    className={formData.type === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    {isPending ? 'جاري الحفظ...' : 'حفظ المعاملة'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Transactions History */}
                <Card className="border shadow-sm">
                    <CardHeader className="border-b py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-lg md:text-xl">سجل المعاملات ({filteredTransactions.length})</CardTitle>

                        {/* Type Filter */}
                        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                            <Button
                                variant={typeFilter === 'ALL' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setTypeFilter('ALL')}
                                className="text-xs h-7 px-3"
                            >الكل</Button>
                            <Button
                                variant={typeFilter === 'INCOME' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setTypeFilter('INCOME')}
                                className="text-xs h-7 px-3 text-green-600"
                            >وارد</Button>
                            <Button
                                variant={typeFilter === 'EXPENSE' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setTypeFilter('EXPENSE')}
                                className="text-xs h-7 px-3 text-red-600"
                            >صادر</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">نوع المعاملة</TableHead>
                                        <TableHead className="text-right">الجهة / الطرف</TableHead>
                                        <TableHead className="text-right">المبلغ</TableHead>
                                        <TableHead className="text-right hidden md:table-cell">الوصف</TableHead>
                                        <TableHead className="text-right hidden lg:table-cell">التاريخ</TableHead>
                                        <TableHead className="text-right">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                لا توجد معاملات مسجلة في هذه الفترة للفلتر المختار
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTransactions.map((tx) => (
                                            <TableRow
                                                key={tx._id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => handleTxClick(tx)}
                                            >
                                                <TableCell>
                                                    <Badge variant={tx.type === 'INCOME' ? 'default' : 'destructive'} className="gap-1 min-w-[70px] justify-center">
                                                        {tx.type === 'INCOME' ? 'وارد' : 'صادر'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {tx.referenceType === 'Invoice' ? (
                                                                tx.referenceId?.customer?._id ? (
                                                                    <Link
                                                                        href={`/customers/${tx.referenceId.customer._id}`}
                                                                        className="hover:text-primary underline-offset-4 hover:underline"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        {tx.referenceId?.customer?.name || tx.referenceId?.customerName || 'عميل نقدي'}
                                                                    </Link>
                                                                ) : (tx.referenceId?.customerName || 'عميل نقدي')
                                                            ) : tx.referenceType === 'PurchaseOrder' ? (
                                                                tx.referenceId?.supplier?._id ? (
                                                                    <Link
                                                                        href={`/suppliers/${tx.referenceId.supplier._id}`}
                                                                        className="hover:text-primary underline-offset-4 hover:underline"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        {tx.referenceId?.supplier?.name || 'مورد'}
                                                                    </Link>
                                                                ) : (tx.referenceId?.supplierName || 'مورد')
                                                            ) : tx.referenceType === 'Debt' ? (
                                                                tx.referenceId?.debtorId?._id ? (
                                                                    <Link
                                                                        href={tx.referenceId?.debtorType === 'Supplier' ? `/suppliers/${tx.referenceId.debtorId._id}` : `/customers/${tx.referenceId.debtorId._id}`}
                                                                        className="hover:text-primary underline-offset-4 hover:underline"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        {tx.referenceId?.debtorId?.name || 'طرف مديون'}
                                                                    </Link>
                                                                ) : (tx.referenceId?.debtorId?.name || 'طرف مديون')
                                                            ) : '---'}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {tx.referenceType === 'Invoice' ? `فاتورة #${tx.referenceId?.number || ''}` :
                                                                tx.referenceType === 'PurchaseOrder' ? `أمر شراء #${tx.referenceId?.poNumber || ''}` :
                                                                    tx.referenceType === 'Debt' ? `دين / مطالبات` : ''}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={`font-bold text-base ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.amount.toLocaleString()} ج.م
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex flex-col">
                                                        <span>{tx.description}</span>
                                                        <Badge variant="outline" className="text-[10px] w-fit mt-1 opacity-70">
                                                            {tx.referenceType === 'Manual' ? 'يدوي' :
                                                                tx.referenceType === 'Invoice' ? 'فاتورة' :
                                                                    tx.referenceType === 'PurchaseOrder' ? 'أمر شراء' :
                                                                        tx.referenceType === 'Debt' ? 'دين / مديونية' : tx.referenceType}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-xs hidden lg:table-cell">
                                                    {format(new Date(tx.date || tx.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-primary h-8 w-8"
                                                            onClick={() => handleTxClick(tx)}
                                                        >
                                                            <Info size={16} />
                                                        </Button>
                                                        {tx.referenceType === 'Manual' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                                                                onClick={() => handleDelete(tx._id)}
                                                                disabled={isDeleting}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent dir="rtl" className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Info className="text-primary" />
                            تفاصيل العملية المالية
                        </DialogTitle>
                    </DialogHeader>

                    {selectedTx && (
                        <div className="space-y-6 py-4">
                            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">المبلغ</p>
                                    <p className={`text-2xl font-bold ${selectedTx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedTx.amount.toLocaleString()} ج.م
                                    </p>
                                </div>
                                <Badge variant={selectedTx.type === 'INCOME' ? 'default' : 'destructive'} className="h-8 px-4 text-sm">
                                    {selectedTx.type === 'INCOME' ? 'وارد' : 'صادر'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Tag size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">الوصف</p>
                                        <p className="text-base">{selectedTx.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <User size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">المسؤول عن العملية</p>
                                        <p className="text-base font-semibold">{selectedTx.createdBy?.name || 'غير معروف'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Clock size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">وقت وتاريخ العملية</p>
                                        <p className="text-base">{format(new Date(selectedTx.date || selectedTx.createdAt), 'PPPP p', { locale: ar })}</p>
                                    </div>
                                </div>

                                {(selectedTx.referenceType === 'Invoice' || selectedTx.referenceType === 'PurchaseOrder' || selectedTx.referenceType === 'Debt') && (
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <ExternalLink size={18} />
                                        </div>
                                        <div className="space-y-1 w-full">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {selectedTx.referenceType === 'Invoice' ? 'إلى العميل' :
                                                    selectedTx.referenceType === 'PurchaseOrder' ? 'من المورد' : 'جهة المديونية'}
                                            </p>
                                            <div className="flex flex-col gap-1">
                                                {selectedTx.referenceType === 'Invoice' && (
                                                    <>
                                                        <p className="font-semibold text-lg">
                                                            {selectedTx.referenceId?.customer?.name ||
                                                                selectedTx.referenceId?.customerName ||
                                                                (selectedTx.description.includes('رصيد افتتاحي') ? 'عميل (رصيد سابق)' : 'عميل نقدي')}
                                                        </p>
                                                        {selectedTx.referenceId?.number && <Badge variant="outline" className="w-fit">فاتورة #{selectedTx.referenceId.number}</Badge>}
                                                    </>
                                                )}
                                                {selectedTx.referenceType === 'PurchaseOrder' && (
                                                    <>
                                                        <p className="font-semibold text-lg">{selectedTx.referenceId?.supplier?.name || 'مورد'}</p>
                                                        {selectedTx.referenceId?.poNumber && <Badge variant="outline" className="w-fit">أمر شراء #{selectedTx.referenceId.poNumber}</Badge>}
                                                    </>
                                                )}
                                                {selectedTx.referenceType === 'Debt' && (
                                                    <>
                                                        <p className="font-semibold text-lg">{selectedTx.referenceId?.debtorId?.name || 'غير معروف'}</p>
                                                        <Badge variant="outline" className="w-fit">معاملة دين</Badge>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Info size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">مرجع النظام</p>
                                        <Badge variant="outline" className="capitalize">
                                            {selectedTx.referenceType === 'Manual' ? 'إدخال يدوي' :
                                                selectedTx.referenceType === 'Invoice' ? 'نظام المبيعات' :
                                                    selectedTx.referenceType === 'PurchaseOrder' ? 'نظام المشتريات' :
                                                        selectedTx.referenceType === 'Debt' ? 'نظام الديون والمديونيات' : selectedTx.referenceType}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button className="w-full" onClick={() => setIsDetailsOpen(false)}>إغلاق</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

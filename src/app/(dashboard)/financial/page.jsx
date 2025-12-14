'use client';

import { useState } from 'react';
import { useTreasury, useAddTransaction } from '@/hooks/useFinancial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, Minus, Loader2 } from 'lucide-react';

export default function FinancialPage() {
    const { data, isLoading } = useTreasury();
    const { mutate: addTransaction, isPending } = useAddTransaction();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ amount: '', description: '', type: 'INCOME' });

    const handleSubmit = () => {
        if (!formData.amount || !formData.description) return;
        addTransaction(formData, {
            onSuccess: () => {
                setIsDialogOpen(false);
                setFormData({ amount: '', description: '', type: 'INCOME' });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const balance = data?.balance || 0;
    const transactions = data?.transactions || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">الخزينة (النظام المالي)</h1>
            </div>

            {/* Balance and Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Balance Card */}
                <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base md:text-lg opacity-90">الرصيد الحالي</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl md:text-4xl font-bold">{balance.toLocaleString()} ج.م</div>
                        <p className="text-xs md:text-sm opacity-70 mt-2">النقدية المتاحة في الخزينة</p>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="h-full min-h-[120px] flex-col gap-2 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                            >
                                <Plus size={24} />
                                <span className="text-sm md:text-base">إضافة رصيد / إيداع</span>
                            </Button>
                        </DialogTrigger>
                        <DialogTrigger asChild>
                            <Button
                                className="h-full min-h-[120px] flex-col gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                            >
                                <Minus size={24} />
                                <span className="text-sm md:text-base">تسجيل مصروفات</span>
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
            </div>

            {/* Transactions History */}
            <Card className="border shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg md:text-xl">سجل المعاملات الأخيرة</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">نوع المعاملة</TableHead>
                                    <TableHead className="text-right">المبلغ</TableHead>
                                    <TableHead className="text-right hidden md:table-cell">الوصف</TableHead>
                                    <TableHead className="text-right hidden lg:table-cell">التاريخ</TableHead>
                                    <TableHead className="text-right hidden lg:table-cell">بواسطة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            لا توجد معاملات مسجلة
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((tx) => (
                                        <TableRow key={tx._id}>
                                            <TableCell>
                                                <Badge variant={tx.type === 'INCOME' ? 'default' : 'destructive'} className="gap-1">
                                                    {tx.type === 'INCOME' ? (
                                                        <>
                                                            <ArrowDownCircle size={14} />
                                                            وارد
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ArrowUpCircle size={14} />
                                                            صادر
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-base md:text-lg">
                                                {tx.amount.toLocaleString()} ج.م
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex flex-col">
                                                    <span>{tx.description}</span>
                                                    <Badge variant="outline" className="text-[10px] w-fit mt-1">
                                                        {tx.referenceType}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-sm hidden lg:table-cell">
                                                {new Date(tx.createdAt).toLocaleString('ar-SA')}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                                                {tx.createdBy?.name || 'النظام'}
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
    );
}

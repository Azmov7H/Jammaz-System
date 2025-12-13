'use client';

import { useState } from 'react';
import { useTreasury, useAddTransaction } from '@/hooks/useFinancial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#1B3C73]" size={40} /></div>;

    const balance = data?.balance || 0;
    const transactions = data?.transactions || [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1B3C73] flex items-center gap-2">
                <Wallet className="w-8 h-8" /> الخزينة (النظام المالي)
            </h1>

            {/* Balance Card */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-[#1B3C73] to-[#2a5298] text-white border-none shadow-lg col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg opacity-90">الرصيد الحالي</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{balance.toLocaleString()} ج.م</div>
                        <p className="text-sm opacity-70 mt-2">النقدية المتاحة في الخزينة</p>
                    </CardContent>
                </Card>

                <div className="col-span-2 flex items-center gap-4">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-24 flex-1 text-lg gap-2 bg-green-600 hover:bg-green-700" onClick={() => setFormData({ ...formData, type: 'INCOME' })}>
                                <Plus size={24} /> إضافة رصيد / إيداع
                            </Button>
                        </DialogTrigger>
                        <DialogTrigger asChild>
                            <Button className="h-24 flex-1 text-lg gap-2 bg-red-600 hover:bg-red-700" onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}>
                                <Minus size={24} /> تسجيل مصروفات
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{formData.type === 'INCOME' ? 'إيداع نقدي / إضافة رصيد' : 'تسجيل مصروف خارجي'}</DialogTitle>
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
                                <Button onClick={handleSubmit} className={formData.type === 'INCOME' ? 'bg-green-600' : 'bg-red-600'}>
                                    {isPending ? 'جاري الحفظ...' : 'حفظ المعاملة'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Transactions History */}
            <div className="bg-white rounded-xl border shadow-sm">
                <div className="p-4 border-b">
                    <h2 className="font-bold text-lg text-slate-800">سجل المعاملات الأخيرة</h2>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">نوع المعاملة</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">الوصف</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">بواسطة</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">لا توجد معاملات مسجلة</TableCell></TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx._id}>
                                    <TableCell>
                                        <span className={`flex items-center gap-2 font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'INCOME' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                                            {tx.type === 'INCOME' ? 'وارد (إيداع)' : 'صادر (مصروف)'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-bold text-lg">
                                        {tx.amount.toLocaleString()} ج.م
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{tx.description}</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-100 w-fit px-1 rounded">{tx.referenceType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 font-mono text-sm">
                                        {new Date(tx.createdAt).toLocaleDateString('ar-EG')} {new Date(tx.createdAt).toLocaleTimeString('ar-EG')}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500">
                                        {tx.createdBy?.name || 'النظام'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

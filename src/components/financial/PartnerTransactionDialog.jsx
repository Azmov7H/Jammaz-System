'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, Receipt, Printer, ArrowDownCircle, ArrowUpCircle, ExternalLink, Calendar, Search } from 'lucide-react';
import { usePartnerTransactions } from '@/hooks/useFinancial';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export function PartnerTransactionDialog({ partner, open, onOpenChange }) {
    const [search, setSearch] = useState('');
    const { data: transactions, isLoading } = usePartnerTransactions(partner?._id);

    const filteredTransactions = transactions?.filter(tx =>
        tx.description.toLowerCase().includes(search.toLowerCase()) ||
        tx.receiptNumber?.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const handlePrint = () => {
        const printContent = document.getElementById('print-area');
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // To restore React state
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[2.5rem]" dir="rtl">
                <DialogHeader className="p-8 pb-4 bg-muted/30 border-b border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <Receipt size={28} />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black">سجل المعاملات المالية</DialogTitle>
                                <p className="text-sm text-muted-foreground font-bold mt-0.5">{partner?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={handlePrint} className="h-11 rounded-xl gap-2 font-bold border-white/10 hover:bg-white/5 transition-all">
                                <Printer size={18} /> طباعة السجل
                            </Button>
                        </div>
                    </div>

                    <div className="relative mt-6">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 h-5 w-5" />
                        <Input
                            placeholder="ابحث في المعاملات، أرقام السندات، أو الوصف..."
                            className="h-12 pr-12 rounded-2xl bg-card/50 border-white/5 focus:bg-card/80 transition-all font-bold"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 pt-4">
                    <div id="print-area">
                        {/* Print Header (Visible only on print) */}
                        <div className="hidden print:block mb-10 text-center border-b pb-6" dir="rtl">
                            <h1 className="text-3xl font-black mb-2">سجل كشف حساب مالي</h1>
                            <p className="text-xl font-bold">{partner?.name}</p>
                            <p className="text-sm text-muted-foreground mt-2">تاريخ الاستخراج: {format(new Date(), 'dd MMMM yyyy', { locale: ar })}</p>
                            <div className="mt-4 flex justify-center gap-8">
                                <div className="text-center">
                                    <span className="text-xs text-muted-foreground block">الرصيد الحالي</span>
                                    <span className="text-xl font-black">{partner?.balance?.toLocaleString()} ج.م</span>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <p className="font-bold text-muted-foreground">جاري المزامنة مع الخزينة...</p>
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-white/10">
                                <Receipt className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                                <p className="text-xl font-black text-muted-foreground/50">لا توجد معاملات مالية مسجلة بعد</p>
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-white/10 overflow-hidden shadow-sm bg-card/30 backdrop-blur-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 border-white/5 h-14">
                                            <TableHead className="text-right font-black uppercase text-xs tracking-widest px-6">التاريخ</TableHead>
                                            <TableHead className="text-right font-black uppercase text-xs tracking-widest px-6">البيان / الوصف</TableHead>
                                            <TableHead className="text-center font-black uppercase text-xs tracking-widest px-6">النوع</TableHead>
                                            <TableHead className="text-center font-black uppercase text-xs tracking-widest px-6">قيمة (وارد)</TableHead>
                                            <TableHead className="text-center font-black uppercase text-xs tracking-widest px-6">قيمة (صادر)</TableHead>
                                            <TableHead className="text-center font-black uppercase text-xs tracking-widest px-6 print:hidden">إجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTransactions.map((tx) => (
                                            <TableRow key={tx._id} className="h-16 border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <TableCell className="px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-foreground/80">{format(new Date(tx.date), 'dd/MM/yyyy')}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{format(new Date(tx.date), 'HH:mm')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <div className="flex flex-col max-w-[300px]">
                                                        <span className="font-bold text-sm leading-snug">{tx.description}</span>
                                                        {tx.receiptNumber && (
                                                            <span className="text-[10px] text-primary/70 font-black mt-0.5">سند #{tx.receiptNumber}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 text-center">
                                                    <Badge variant="outline" className="text-[10px] font-black h-5 border-white/10 bg-white/5">
                                                        {tx.referenceType === 'Invoice' ? 'فاتورة' :
                                                            tx.referenceType === 'PurchaseOrder' ? 'شراء' :
                                                                tx.referenceType === 'SalesReturn' ? 'مرتجع' :
                                                                    tx.referenceType === 'Debt' ? 'دين' :
                                                                        tx.referenceType === 'UnifiedCollection' ? 'تحصيل' : 'يدوي'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 text-center">
                                                    {tx.type === 'INCOME' ? (
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex items-center gap-1.5 text-emerald-500 font-black text-lg">
                                                                <ArrowDownCircle size={14} />
                                                                <span>{tx.amount.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ) : '---'}
                                                </TableCell>
                                                <TableCell className="px-6 text-center">
                                                    {tx.type === 'EXPENSE' ? (
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex items-center gap-1.5 text-rose-500 font-black text-lg">
                                                                <ArrowUpCircle size={14} />
                                                                <span>{tx.amount.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ) : '---'}
                                                </TableCell>
                                                <TableCell className="px-6 text-center print:hidden">
                                                    {(tx.referenceType === 'Invoice' || tx.referenceType === 'PurchaseOrder') && tx.referenceId && (
                                                        <Link
                                                            href={tx.referenceType === 'Invoice' ? `/invoices/${tx.referenceId._id || tx.referenceId}` : `/purchase-orders/${tx.referenceId._id || tx.referenceId}`}
                                                            className="text-muted-foreground hover:text-primary transition-colors inline-block p-2 rounded-xl hover:bg-primary/5"
                                                            title="عرض المستند"
                                                        >
                                                            <ExternalLink size={18} />
                                                        </Link>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-8 border-t border-white/10 bg-muted/20">
                    <div className="w-full flex justify-between items-center">
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">إجمالي الوارد</span>
                                <span className="text-xl font-black text-emerald-500 leading-none">
                                    {filteredTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">إجمالي الصادر</span>
                                <span className="text-xl font-black text-rose-500 leading-none">
                                    {filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-10 h-12 font-black border border-white/5 hover:bg-white/5">
                            إغلاق
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

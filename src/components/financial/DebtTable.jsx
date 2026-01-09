'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpRight, History } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const STATUS_STYLES = {
    active: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    overdue: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    settled: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'written-off': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const STATUS_LABELS = {
    active: 'نشط',
    overdue: 'متأخر',
    settled: 'مسدد',
    'written-off': 'مشطوب',
};

export function DebtTable({ debts, onRecordPayment }) {
    const router = useRouter();

    return (
        <div className="rounded-xl border border-white/5 overflow-hidden">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-right">المرجع</TableHead>
                        <TableHead className="text-right">المدين / الدائن</TableHead>
                        <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-right">المبلغ الأصلي</TableHead>
                        <TableHead className="text-right">المتبقي</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {debts.map((debt) => (
                        <TableRow key={debt._id} className="border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span className="font-bold text-foreground">
                                        {debt.referenceType === 'Invoice' ? 'فاتورة' : 'أمر شراء'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        #{debt.referenceId?.toString().slice(-6) || 'N/A'}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-bold">{debt.debtorId?.name || 'Unknown'}</span>
                                    <span className="text-[10px] text-muted-foreground">{debt.debtorId?.phone}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-mono text-xs">{formatDate(debt.dueDate)}</span>
                                    {/* Show days remaining/overdue logic here if needed */}
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {formatCurrency(debt.originalAmount)}
                            </TableCell>
                            <TableCell className="font-black text-foreground">
                                {formatCurrency(debt.remainingAmount)}
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant="outline" className={`font-bold ${STATUS_STYLES[debt.status] || ''}`}>
                                    {STATUS_LABELS[debt.status] || debt.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal size={14} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 bg-card border-white/10">
                                        <DropdownMenuItem
                                            className="gap-2 cursor-pointer"
                                            onClick={() => router.push(`/financial/debt-center/${debt._id}`)}
                                        >
                                            <History size={14} /> التفاصيل
                                        </DropdownMenuItem>
                                        {debt.remainingAmount > 0 && (
                                            <DropdownMenuItem
                                                className="gap-2 cursor-pointer text-emerald-500 focus:text-emerald-500"
                                                onClick={() => onRecordPayment(debt)}
                                            >
                                                <ArrowUpRight size={14} /> تسجيل دفعة
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {debts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                لا توجد ديون مسجلة
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

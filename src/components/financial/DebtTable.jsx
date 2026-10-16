'use client';

import React from 'react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import Link from "next/link"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpRight, History, Calendar, User, FileText, Layers, Edit2, Coins } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/utils';
import { TableEmptyState } from '@/components/common/EmptyState';
import { useRouter } from 'next/navigation';
import { DebtEditDialog } from './DebtEditDialog';
import { useState } from 'react';

const STATUS_STYLES = {
    active: 'bg-info/10 text-info border-info/20',
    overdue: 'bg-destructive/10 text-destructive border-destructive/20',
    settled: 'bg-success/10 text-success border-success/20',
    'written-off': 'bg-muted500/10 text-muted-foreground border-border/20',
};

const STATUS_LABELS = {
    active: 'نشط',
    overdue: 'متأخر',
    settled: 'مسدد',
    'written-off': 'مشطوب',
};

export const DebtTable = React.memo(function DebtTable({ debts, onRecordPayment, onScheduleInstallment, onUnifiedCollection }) {
    const router = useRouter();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedDebtForEdit, setSelectedDebtForEdit] = useState(null);

    const handleEditDebt = (debt) => {
        setSelectedDebtForEdit(debt);
        setEditDialogOpen(true);
    };

    return (
        <div className="overflow-hidden">
            <Table aria-label="الديون">
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-white/5 hover:bg-transparent h-16">
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-right px-6">المرجع</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-right">المدين / الدائن</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-right">تاريخ الاستحقاق</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-right">المبلغ</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-center">الحالة</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {debts.map((debt) => (
                        <TableRow key={debt._id} className="border-white/5 hover:bg-muted/50 transition-colors group h-20">
                            <TableCell className="px-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <FileText size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground text-sm">
                                                {debt.referenceType === 'Invoice' ? 'فاتورة مبيعات' : 'أمر شراء'}
                                            </span>
                                            {debt.meta?.isScheduled && (
                                                <Badge variant="outline" className="text-xs font-bold h-4 px-1 border-primary/20 bg-primary/5 text-primary">مجدول</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground font-bold font-mono">
                                            #{debt.referenceId?.toString().slice(-6).toUpperCase() || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <Link
                                            href={debt.debtorType === 'Customer' ? `/customers/${debt.debtorId?._id}` : `/suppliers/${debt.debtorId?._id}`}
                                            className="hover:text-primary transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="font-bold text-sm">{debt.debtorId?.name || 'غير معروف'}</span>
                                        </Link>
                                        <span className="text-xs text-muted-foreground font-medium">{debt.debtorId?.phone}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-muted-foreground" />
                                    <span className="font-mono text-xs font-bold">{formatDate(debt.dueDate)}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 font-bold text-foreground">
                                        <span className="font-mono text-base">{debt.remainingAmount.toLocaleString()}</span>
                                        <span className="text-xs text-muted-foreground italic">د.ل</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "font-bold text-xs h-6 px-3 rounded-lg border-2",
                                        STATUS_STYLES[debt.status] || ''
                                    )}
                                >
                                    {STATUS_LABELS[debt.status] || debt.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="px-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" aria-label="خيارات الدين" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                            <MoreHorizontal size={18} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 bg-card border-white/10 rounded-2xl shadow-custom-xl">
                                        <DropdownMenuItem
                                            className="gap-2 p-3 rounded-xl cursor-pointer font-bold focus:bg-primary/10 transition-colors"
                                            onClick={() => router.push(`/financial/debt-center/${debt._id}`)}
                                        >
                                            <History size={16} className="text-primary" /> تفاصيل المديونية
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            className="gap-2 p-3 rounded-xl cursor-pointer font-bold text-warning focus:text-warning focus:bg-warning/10 transition-colors"
                                            onClick={() => handleEditDebt(debt)}
                                        >
                                            <Edit2 size={16} /> تعديل المبالغ
                                        </DropdownMenuItem>

                                        {debt.remainingAmount > 0 && (
                                            <>
                                                <DropdownMenuItem
                                                    className="gap-2 p-3 rounded-xl cursor-pointer font-bold text-primary focus:text-primary focus:bg-primary/10 transition-colors"
                                                    onClick={() => onScheduleInstallment(debt)}
                                                >
                                                    <Layers size={16} /> جدولة المديونية (أقساط)
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="gap-2 p-3 rounded-xl cursor-pointer font-bold text-success focus:text-success focus:bg-success/10 transition-colors"
                                                    onClick={() => onRecordPayment(debt)}
                                                >
                                                    <ArrowUpRight size={16} /> تسجيل دفعة سداد
                                                </DropdownMenuItem>

                                                {debt.debtorType === 'Customer' && (
                                                    <DropdownMenuItem
                                                        className="gap-2 p-3 rounded-xl cursor-pointer font-bold text-info focus:text-info focus:bg-info/10 transition-colors"
                                                        onClick={() => onUnifiedCollection(debt)}
                                                    >
                                                        <Coins size={16} /> تحصيل من الرصيد الإجمالي
                                                    </DropdownMenuItem>
                                                )}
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {debts.length === 0 && (
                        <TableEmptyState colSpan={6} icon={FileText} title="لا توجد ديون مسجلة حالياً" />
                    )}
                </TableBody>
            </Table>
            <DebtEditDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                debt={selectedDebtForEdit}
            />
        </div >
    );
});

// Helper to handle class merging if needed, or import from @/lib/utils if available
function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}

'use client';

import Link from "next/link";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Info, RotateCcw, Eye, ReceiptCent, ChevronRight, ChevronLeft } from 'lucide-react';
import { getPaymentLabel, maskSource } from '@/lib/paymentMethods';
import { useUserRole } from '@/hooks/useUserRole';
import { ROLES } from '@/lib/permissions';
import { getReversalAction, getReversalStateLabel } from '@/lib/transactionReversal';

function PartyCell({ tx }) {
    if (tx.referenceType === 'UnifiedCollection') {
        return (
            <div className="flex flex-col">
                <span className="font-medium">
                    {tx.referenceId?._id ? (
                        <Link
                            href={`/customers/${tx.referenceId._id}`}
                            className="hover:text-primary underline-offset-4 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {tx.referenceId?.name || 'تحصيل مجمع'}
                        </Link>
                    ) : 'تحصيل مجمع'}
                </span>
                <span className="text-xs text-muted-foreground">تحصيل مجمع</span>
            </div>
        );
    }
    return null;
}

export function TransactionsTable({ transactions, typeFilter, onTypeFilterChange, onTxClick, onReverse, isReversing, page = 1, totalPages = 1, total = 0, onPageChange }) {
    const { role } = useUserRole();
    const canDelete = role === ROLES.OWNER;
    return (
        <>
                            <Card className="border shadow-sm">
                    <CardHeader className="border-b py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-lg md:text-xl">سجل المعاملات ({transactions.length})</CardTitle>

                        {/* Type Filter */}
                        <div className="flex flex-wrap items-center gap-2 bg-muted p-1 rounded-lg">
                            <Button
                                variant={typeFilter === 'ALL' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => onTypeFilterChange('ALL')}
                                className="text-xs h-7 px-3"
                            >الكل</Button>
                            <Button
                                variant={typeFilter === 'INCOME' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => onTypeFilterChange('INCOME')}
                                className="text-xs h-7 px-3 text-success"
                            >إيرادات</Button>
                            <Button
                                variant={typeFilter === 'SUPPLIER_PAYMENTS' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => onTypeFilterChange('SUPPLIER_PAYMENTS')}
                                className="text-xs h-7 px-3 text-warning"
                            >دفعات موردين</Button>
                            <Button
                                variant={typeFilter === 'SHOP_EXPENSES' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => onTypeFilterChange('SHOP_EXPENSES')}
                                className="text-xs h-7 px-3 text-destructive"
                            >مصروفات</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table aria-label="الحركات المالية">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">نوع المعاملة</TableHead>
                                        <TableHead className="text-right">الجهة / الطرف</TableHead>
                                        <TableHead className="text-right">المبلغ</TableHead>
                                        <TableHead className="text-right">الوسيلة</TableHead>
                                        <TableHead className="text-right hidden md:table-cell">الوصف</TableHead>
                                        <TableHead className="text-right hidden lg:table-cell">التاريخ</TableHead>
                                        <TableHead className="text-right">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                لا توجد معاملات مسجلة في هذه الفترة للفلتر المختار
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((tx) => (
                                            <TableRow
                                                key={tx._id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => onTxClick(tx)}
                                            >
                                                <TableCell>
                                                    <Badge variant={tx.type === 'INCOME' ? 'default' : 'destructive'} className="gap-1 min-w-[70px] justify-center">
                                                        {tx.type === 'INCOME' ? 'وارد' : 'صادر'}
                                                    </Badge>
                                                    {getReversalStateLabel(tx) && (
                                                        <Badge variant="outline" className="gap-1 min-w-[70px] justify-center mt-1 block text-[10px] opacity-80">
                                                            {getReversalStateLabel(tx)}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {tx.referenceType === 'UnifiedCollection' ? (
                                                        <PartyCell tx={tx} />
                                                    ) : (
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
                                                            ) : tx.referenceType === 'Reversal' ? (
                                                                tx.referenceId?.name || 'عكس'
                                                            ) : '---'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {tx.referenceType === 'Invoice' ? `فاتورة #${tx.referenceId?.number || ''}` :
                                                                tx.referenceType === 'PurchaseOrder' ? `أمر شراء #${tx.referenceId?.poNumber || ''}` :
                                                                    tx.referenceType === 'Debt' ? `دين / مطالبات` : ''}
                                                        </span>
                                                    </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className={`font-bold text-base ${tx.type === 'INCOME' ? 'text-success' : 'text-destructive'}`}>
                                                    {tx.amount.toLocaleString()} ج.م
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs bg-muted/30">
                                                        {getPaymentLabel(tx.method)}
                                                    </Badge>
                                                    {maskSource(tx.sourceNumber) && (
                                                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5" dir="ltr">
                                                            {maskSource(tx.sourceNumber)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex flex-col">
                                                        <span>{tx.description}</span>
                                                        <Badge variant="outline" className="text-xs w-fit mt-1 opacity-70">
                                                            {tx.type === 'INCOME' ?
                                                                (tx.referenceType === 'Invoice' ? 'مبيعات' :
                                                                    tx.referenceType === 'UnifiedCollection' ? 'تحصيل مجمع' : 'إيداع إضافي') :
                                                                (tx.referenceType === 'PurchaseOrder' || (tx.referenceType === 'Debt' && tx.referenceId?.debtorType === 'Supplier') ? 'دفعة مورد' :
                                                                    tx.referenceType === 'SalesReturn' ? 'مرتجع مبيعات' : 'مصاريف عامة')
                                                            }
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
                                                            aria-label="تفاصيل الحركة"
                                                            className="text-muted-foreground hover:text-primary h-8 w-8"
                                                            onClick={() => onTxClick(tx)}
                                                        >
                                                            <Info size={16} />
                                                        </Button>

                                                        {/* Quick Access Buttons */}
                                                        {tx.referenceType === 'Invoice' && tx.referenceId?._id && (
                                                            <Link href={`/invoices/${tx.referenceId._id}`} onClick={(e) => e.stopPropagation()}>
                                                                <Button variant="ghost" size="icon" aria-label="عرض الفاتورة" className="text-muted-foreground hover:text-info h-8 w-8">
                                                                    <Eye size={16} />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {tx.referenceType === 'PurchaseOrder' && tx.referenceId?._id && (
                                                            <Link href={`/purchase-orders/${tx.referenceId._id}`} onClick={(e) => e.stopPropagation()}>
                                                                <Button variant="ghost" size="icon" aria-label="عرض أمر الشراء" className="text-muted-foreground hover:text-warning h-8 w-8">
                                                                    <Eye size={16} />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {(tx.type === 'INCOME' || tx.referenceType === 'UnifiedCollection') && (
                                                            <Link href={`/financial/receipts/${tx._id}`} onClick={(e) => e.stopPropagation()}>
                                                                <Button variant="ghost" size="icon" aria-label="عرض الإيصال" className="text-muted-foreground hover:text-success h-8 w-8">
                                                                    <ReceiptCent size={16} />
                                                                </Button>
                                                            </Link>
                                                        )}

                                                        {(() => {
                                                            const rev = getReversalAction(tx, role);
                                                            if (rev.canReverse) {
                                                                return (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        aria-label="عكس المعاملة"
                                                                        title="عكس المعاملة (تعويضي — يحافظ على التاريخ)"
                                                                        className="text-muted-foreground hover:text-warning h-8 w-8"
                                                                        onClick={() => onReverse?.(tx)}
                                                                        disabled={isReversing}
                                                                    >
                                                                        <RotateCcw size={16} />
                                                                    </Button>
                                                                );
                                                            }
                                                            if (canDelete && rev.guidance) {
                                                                return (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        aria-label="غير قابلة للعكس"
                                                                        title={rev.guidance}
                                                                        className="text-muted-foreground/40 cursor-not-allowed h-8 w-8"
                                                                    >
                                                                        <RotateCcw size={16} />
                                                                    </Button>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    {totalPages > 1 && (
                        <CardFooter className="border-t py-3 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-muted-foreground">
                                صفحة {page} من {totalPages} • إجمالي {total.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1 text-xs"
                                    disabled={page <= 1}
                                    onClick={() => onPageChange?.(page - 1)}
                                >
                                    <ChevronRight size={14} /> السابق
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1 text-xs"
                                    disabled={page >= totalPages}
                                    onClick={() => onPageChange?.(page + 1)}
                                >
                                    التالي <ChevronLeft size={14} />
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
        </>
    );
}
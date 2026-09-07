'use client';

/**
 * DOC-SSTMT-001 — SupplierStatementTab.
 *
 * The new official supplier account statement tab on /suppliers/[id].
 * Lives next to the legacy in-app statement tab; this one drives the
 * redesigned document engine so the printed / PDF / Excel output is
 * the same as the on-screen preview.
 *
 * UX:
 *   - DateRangePicker with sensible presets
 *   - three summary cards: openingBalance / period debits / period credits
 *   - closing balance + reconciliation delta banner
 *   - line-by-line preview table (running balance, debit/credit columns)
 *   - DocumentActions: Preview, Print, PDF (PDF returns 501 until Sprint 10)
 *
 * Closes the opening-balance bug by reading openingBalance from
 * the document engine response (which is now computed via DB
 * aggregation, not started at 0).
 */

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Loader2, FileText, ArrowDownLeft, ArrowUpRight, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/documents/DateRangePicker';
import { DocumentActions } from '@/components/documents/DocumentActions';
import { getDocumentData, DOCUMENT_TYPES, OUTPUT_FORMATS } from '@/services/documentService';
import { cn } from '@/utils';

function fmtMoney(n) {
    return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineTypeMeta(type) {
    if (type === 'PURCHASE_ORDER') return { label: 'أمر شراء', icon: Package, cls: 'bg-destructive/10 text-destructive border-destructive/20' };
    if (type === 'PAYMENT') return { label: 'سداد للمورد', icon: ArrowDownLeft, cls: 'bg-success/10 text-success border-success/20' };
    if (type === 'REFUND') return { label: 'استرداد من المورد', icon: ArrowUpRight, cls: 'bg-warning/10 text-warning border-warning/20' };
    return { label: type || '-', icon: FileText, cls: 'bg-muted text-muted-foreground' };
}

function defaultRange() {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    return {
        from: format(from, 'yyyy-MM-dd'),
        to: format(to, 'yyyy-MM-dd'),
    };
}

export function SupplierStatementTab({ supplierId }) {
    const [range, setRange] = React.useState(defaultRange);

    const filters = React.useMemo(() => ({
        from: range.from ? `${range.from}T00:00:00.000Z` : undefined,
        to: range.to ? `${range.to}T23:59:59.999Z` : undefined,
        startDate: range.from ? `${range.from}T00:00:00.000Z` : undefined,
        endDate: range.to ? `${range.to}T23:59:59.999Z` : undefined,
    }), [range]);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['supplier-statement-doc', supplierId, range],
        queryFn: ({ signal }) => getDocumentData(DOCUMENT_TYPES.SUPPLIER_ACCOUNT_STATEMENT, supplierId, filters, { signal }),
        enabled: !!supplierId && !!range.from && !!range.to,
    });

    const payload = data?.data ?? data;
    const openingBalance = Number(payload?.openingBalance || 0);
    const closingBalance = Number(payload?.closingBalance || 0);
    const snapshotBalance = Number(payload?.currentSnapshotBalance || 0);
    const delta = Number(payload?.balanceDelta || 0);
    const totals = payload?.totals || { debits: 0, credits: 0 };
    const lines = payload?.lines || [];
    const hasDelta = Math.abs(delta) >= 0.01;
    const customerName = payload?.customer?.name || '';

    return (
        <Card className="border-none shadow-2xl bg-card/30 backdrop-blur-md rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">كشف حساب مورد رسمي</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium mt-1">
                            كشف مفصّل من محرك المستندات — مورد — مع رصيد افتتاحي محسوب ووسم تسوية.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <DateRangePicker
                            value={range}
                            onChange={setRange}
                            maxDays={365}
                            className="min-w-[280px]"
                        />
                        <DocumentActions
                            documentType={DOCUMENT_TYPES.SUPPLIER_ACCOUNT_STATEMENT}
                            documentId={supplierId}
                            filters={filters}
                            formats={[OUTPUT_FORMATS.PRINT, OUTPUT_FORMATS.PDF]}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
                {isError && (
                    <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 font-bold flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{String(error?.message || 'تعذّر تحميل الكشف')}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SummaryCard label="الرصيد الافتتاحي" value={fmtMoney(openingBalance)} accent="muted" />
                            <SummaryCard label="إجمالي المدين" value={fmtMoney(totals.debits)} accent="destructive" />
                            <SummaryCard label="إجمالي الدائن" value={fmtMoney(totals.credits)} accent="success" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className={cn(
                                "border-2",
                                closingBalance > 0 ? "border-warning/30 bg-warning/5" :
                                    closingBalance < 0 ? "border-success/30 bg-success/5" :
                                        "border-muted"
                            )}>
                                <CardContent className="p-6">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">الرصيد الختامي</div>
                                    <div className={cn(
                                        "text-3xl font-extrabold font-mono mt-2",
                                        closingBalance > 0 ? "text-warning" :
                                            closingBalance < 0 ? "text-success" : "text-foreground"
                                    )}>
                                        {fmtMoney(closingBalance)} <span className="text-sm text-muted-foreground font-sans">ج.م</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">الرصيد المسجّل بالنظام</div>
                                    <div className="text-3xl font-extrabold font-mono mt-2 text-foreground">
                                        {fmtMoney(snapshotBalance)} <span className="text-sm text-muted-foreground font-sans">ج.م</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className={cn(
                            "rounded-xl p-4 border-2 font-bold flex items-center gap-3",
                            hasDelta
                                ? "bg-warning/5 border-warning/30 text-warning-foreground"
                                : "bg-success/5 border-success/30 text-success-foreground"
                        )}>
                            {hasDelta ? <AlertTriangle className="w-5 h-5 text-warning" /> : <CheckCircle2 className="w-5 h-5 text-success" />}
                            <span data-testid="reconciliation-banner">
                                {hasDelta
                                    ? `تنبيه: فرق تسوية ${fmtMoney(Math.abs(delta))} ج.م — راجع القيود قبل التسليم.`
                                    : 'الرصيد متطابق مع السجل.'}
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-white/5">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent border-white/5">
                                        <TableHead className="text-right font-bold text-xs uppercase tracking-widest px-6">التاريخ</TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase tracking-widest">نوع الحركة / البيان</TableHead>
                                        <TableHead className="text-center font-bold text-xs uppercase tracking-widest text-destructive bg-destructive/5">مدين</TableHead>
                                        <TableHead className="text-center font-bold text-xs uppercase tracking-widest text-success bg-success/5">دائن</TableHead>
                                        <TableHead className="text-center font-bold text-xs uppercase tracking-widest bg-primary/5">الرصيد</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody data-testid="statement-lines" data-line-count={lines.length}>
                                    {lines.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-32 text-muted-foreground font-bold">
                                                لا توجد حركات في هذه الفترة
                                            </TableCell>
                                        </TableRow>
                                    ) : lines.map((line, idx) => {
                                        const meta = lineTypeMeta(line.type);
                                        const Icon = meta.icon;
                                        return (
                                            <TableRow key={line.id || idx} className="border-white/5 hover:bg-white/[0.02]">
                                                <TableCell className="px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono font-bold text-sm">
                                                            {line.dateFormatted ? format(new Date(line.dateFormatted), 'dd/MM/yyyy', { locale: ar }) : '-'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center border", meta.cls)}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm">{meta.label}</span>
                                                            <span className="text-xs text-muted-foreground font-mono">#{line.reference || '-'}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-bold text-destructive">
                                                    {Number(line.debit) > 0 ? fmtMoney(line.debit) : '—'}
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-bold text-success">
                                                    {Number(line.credit) > 0 ? fmtMoney(line.credit) : '—'}
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-extrabold text-primary">
                                                    {fmtMoney(line.balance)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function SummaryCard({ label, value, accent }) {
    const accentCls = accent === 'destructive' ? 'text-destructive' :
        accent === 'success' ? 'text-success' :
            'text-muted-foreground';
    return (
        <Card>
            <CardContent className="p-6">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
                <div className={cn("text-2xl font-extrabold font-mono mt-2", accentCls)}>
                    {value} <span className="text-sm font-sans">ج.م</span>
                </div>
            </CardContent>
        </Card>
    );
}

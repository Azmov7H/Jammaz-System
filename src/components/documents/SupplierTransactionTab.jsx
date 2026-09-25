'use client';

/**
 * DOC-STX-001 — SupplierTransactionTab.
 *
 * The "حركات المورد" tab on /suppliers/[id]. The raw ledger
 * (every transaction that touched the supplier) — NOT the
 * running-balance statement (that's SupplierStatementTab).
 *
 * UX:
 *   - DateRangePicker (default: last 30 days, max 365)
 *   - type filter (كل الحركات / فاتورة مشتريات / دفعة للمورد /
 *     استرداد من المورد / مديونية) via a Select
 *   - summary trio: debits / credits / net
 *   - line-by-line preview table (Arabic dates, type pill, debit /
 *     credit columns, method)
 *   - DocumentActions: Print only (PDF/XLSX/CSV return 501 — backend
 *     renderers not yet implemented)
 */

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AlertTriangle, Loader2, FileText, ArrowDownLeft, ArrowUpRight, ShoppingBasket, FileMinus2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/documents/DateRangePicker';
import { DocumentActions } from '@/components/documents/DocumentActions';
import { getDocumentData, DOCUMENT_TYPES, OUTPUT_FORMATS } from '@/services/documentService';
import { cn } from '@/utils';

function fmtMoney(n) {
    return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineTypeMeta(type) {
    if (type === 'PURCHASE') return { label: 'فاتورة مشتريات', icon: ShoppingBasket, cls: 'bg-destructive/10 text-destructive border-destructive/20' };
    if (type === 'PAYMENT') return { label: 'دفعة للمورد', icon: ArrowDownLeft, cls: 'bg-success/10 text-success border-success/20' };
    if (type === 'REFUND') return { label: 'استرداد من المورد', icon: ArrowUpRight, cls: 'bg-warning/10 text-warning border-warning/20' };
    if (type === 'DEBT') return { label: 'مديونية', icon: FileMinus2, cls: 'bg-info/10 text-info border-info/20' };
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

export function SupplierTransactionTab({ supplierId }) {
    const [range, setRange] = React.useState(defaultRange);
    const [typeFilter, setTypeFilter] = React.useState('all');

    const filters = React.useMemo(() => {
        const f = {
            from: range.from ? `${range.from}T00:00:00.000Z` : undefined,
            to: range.to ? `${range.to}T23:59:59.999Z` : undefined,
            startDate: range.from ? `${range.from}T00:00:00.000Z` : undefined,
            endDate: range.to ? `${range.to}T23:59:59.999Z` : undefined,
        };
        if (typeFilter && typeFilter !== 'all') f.type = typeFilter;
        return f;
    }, [range, typeFilter]);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['supplier-transaction-doc', supplierId, range, typeFilter],
        queryFn: ({ signal }) => getDocumentData(DOCUMENT_TYPES.SUPPLIER_TRANSACTION_STATEMENT, supplierId, filters, { signal }),
        enabled: !!supplierId && !!range.from && !!range.to,
    });

    const payload = data?.data ?? data;
    const totals = payload?.totals || { debits: 0, credits: 0, net: 0 };
    const lines = payload?.lines || [];
    const availableTypes = payload?.availableTypes || [];
    const supplierName = payload?.supplier?.name || '';

    return (
        <Card className="border-none shadow-2xl bg-card/30 backdrop-blur-md rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">حركات المورد</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium mt-1">
                            سجل كل الحركات المالية — مع فلتر حسب نوع الحركة.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <DateRangePicker
                            value={range}
                            onChange={setRange}
                            maxDays={365}
                            className="min-w-[280px]"
                        />
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="min-w-[180px] font-bold" data-testid="transaction-type-filter">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الحركات</SelectItem>
                                {availableTypes.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <DocumentActions
                            documentType={DOCUMENT_TYPES.SUPPLIER_TRANSACTION_STATEMENT}
                            documentId={supplierId}
                            filters={filters}
                            // PDF/XLSX/CSV renderers are not implemented on
                            // the backend (501) — expose only Print.
                            formats={[OUTPUT_FORMATS.PRINT]}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
                {isError && (
                    <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 font-bold flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{String(error?.message || 'تعذّر تحميل الحركات')}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SummaryCard label="إجمالي المدين" value={fmtMoney(totals.debits)} accent="destructive" />
                            <SummaryCard label="إجمالي الدائن" value={fmtMoney(totals.credits)} accent="success" />
                            <SummaryCard label="الصافي" value={fmtMoney(totals.net)} accent="default" />
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-white/5">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent border-white/5">
                                        <TableHead className="text-right font-bold text-xs uppercase tracking-widest px-6">التاريخ</TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase tracking-widest">النوع / البيان</TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase tracking-widest">الطريقة</TableHead>
                                        <TableHead className="text-center font-bold text-xs uppercase tracking-widest text-destructive bg-destructive/5">مدين</TableHead>
                                        <TableHead className="text-center font-bold text-xs uppercase tracking-widest text-success bg-success/5">دائن</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody data-testid="transaction-lines" data-line-count={lines.length}>
                                    {lines.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-32 text-muted-foreground font-bold">
                                                لا توجد حركات في هذه الفترة / النوع
                                            </TableCell>
                                        </TableRow>
                                    ) : lines.map((line, idx) => {
                                        const meta = lineTypeMeta(line.type);
                                        const Icon = meta.icon;
                                        return (
                                            <TableRow key={line.id || idx} className="border-white/5 hover:bg-white/[0.02]">
                                                <TableCell className="px-6">
                                                    <span className="font-mono font-bold text-sm">
                                                        {line.date ? format(new Date(line.date), 'dd/MM/yyyy', { locale: ar }) : '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center border", meta.cls)}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm">{line.typeLabel || meta.label}</span>
                                                            <span className="text-xs text-muted-foreground">{line.label}</span>
                                                            <span className="text-[10px] text-muted-foreground/70 font-mono">#{line.reference || '-'}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground font-bold">{line.methodLabel || '—'}</span>
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-bold text-destructive">
                                                    {Number(line.debit) > 0 ? fmtMoney(line.debit) : '—'}
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-bold text-success">
                                                    {Number(line.credit) > 0 ? fmtMoney(line.credit) : '—'}
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
            'text-foreground';
    return (
        <Card>
            <CardContent className="p-6">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
                <div className={cn("text-2xl font-extrabold font-mono mt-2", accentCls)}>
                    {value} <span className="text-sm text-muted-foreground font-sans">ج.م</span>
                </div>
            </CardContent>
        </Card>
    );
}
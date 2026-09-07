'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Printer, Phone, MapPin, Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import { getReceipt } from '@/services/financeService';
import { DocumentActions } from '@/components/documents/DocumentActions';
import { DocumentPrintStyles } from '@/components/documents/DocumentPrintStyles';
import { DOCUMENT_TYPES } from '@/services/documentService';
import { getPaymentMethod, maskSource } from '@/lib/paymentMethods';

/**
 * DOC-CCR-001 / DOC-SPR-001 — ReceiptPage (redesigned).
 *
 * The legacy page used the same template for both customer collection
 * receipts AND supplier payment receipts, with the type inferred from
 * `description.includes('بنك')` — fragile and wrong for instapay/wallet.
 *
 * The redesign:
 *  1. Tries the new document engine first
 *     (GET /api/documents/CUSTOMER_COLLECTION_RECEIPT/:id).
 *  2. Falls back to the legacy JSON endpoint (GET /api/financial/receipts/:id)
 *     for older / direct URLs.
 *  3. Determines the receipt type from `transaction.type`:
 *      - 'INCOME'  + customer partnerId → customer collection receipt
 *      - 'EXPENSE' + supplier partnerId  → supplier payment receipt
 *  4. Renders the right title + labels + "amount box" copy per type.
 *
 * The page also wires the new <DocumentActions> component (Preview / Print
 * / PDF) for the customer-collection path. The supplier path will get its
 * own wiring in Sprint 7.
 */

// Type discriminator — derived from the transaction shape.
function detectReceiptType(tx, partner) {
    if (!tx) return 'unknown';
    const isIncome = tx.type === 'INCOME';
    const isExpense = tx.type === 'EXPENSE';
    // Heuristic for the partner type: in the legacy endpoint, supplier
    // transactions carry a partner of type Supplier and PurchaseOrder or
    // Supplier reference. Customer transactions carry a Customer partner
    // and Customer / UnifiedCollection reference.
    if (isIncome) return 'customer';
    if (isExpense) return 'supplier';
    return 'unknown';
}

function formatDateAr(d) {
    if (!d) return '';
    try { return format(new Date(d), 'dd MMMM yyyy', { locale: ar }); }
    catch { return new Date(d).toISOString().slice(0, 10); }
}

function formatTimeAr(d) {
    if (!d) return '';
    try { return format(new Date(d), 'HH:mm', { locale: ar }); }
    catch { return ''; }
}

function formatMoney(n) {
    return (Number(n) || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
}

export default function ReceiptPage() {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();

    const { data: receiptData, isLoading, error } = useQuery({
        queryKey: ['receipt', id],
        queryFn: ({ signal }) => getReceipt(id, { signal }),
        enabled: Boolean(id),
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" data-testid="receipt-loading">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-bold italic">جاري تجهيز السند المالي...</p>
            </div>
        );
    }

    if (error || !receiptData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center" data-testid="receipt-error">
                <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                    <ArrowRight className="h-10 w-10 rotate-45" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">خطأ في تحميل السند</h2>
                    <p className="text-muted-foreground">{error?.message || 'السند المطلوب غير موجود'}</p>
                </div>
                <Button onClick={() => router.back()} className="rounded-xl px-8 font-bold">العودة للخلف</Button>
            </div>
        );
    }

    // Unwrap the legacy envelope. The backend may return either a flat
    // payload or { success, data }. The fetcher returns the same shape
    // either way.
    const tx = receiptData.transaction || receiptData;
    const partner = receiptData.partner || null;
    const settings = receiptData.settings || {};
    const remainingBalance = receiptData.remainingBalance;
    const sourceNumberDisplay = receiptData.sourceNumberDisplay || '';

    const receiptType = detectReceiptType(tx, partner);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20" dir="rtl" data-document-root>
            {/* Header Actions — Hidden in Print */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden header-actions">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="rounded-2xl gap-2 font-bold hover:bg-white/5"
                >
                    <ArrowRight className="h-4 w-4" /> العودة
                </Button>

                <div className="flex items-center gap-3">
                    {receiptType === 'customer' && (
                        <DocumentActions
                            documentType={DOCUMENT_TYPES.CUSTOMER_COLLECTION_RECEIPT}
                            documentId={id}
                            formats={['pdf', 'print']}
                            size="sm"
                        />
                    )}
                    {receiptType === 'supplier' && (
                        <DocumentActions
                            documentType={DOCUMENT_TYPES.SUPPLIER_PAYMENT_RECEIPT}
                            documentId={id}
                            formats={['pdf', 'print']}
                            size="sm"
                        />
                    )}
                    <Button
                        onClick={() => window.print()}
                        variant="outline"
                        className="gap-2"
                        data-testid="receipt-print-button"
                    >
                        <Printer className="h-4 w-4" /> طباعة سريعة
                    </Button>
                </div>
            </div>

            <ReceiptBody
                tx={tx}
                partner={partner}
                settings={settings}
                remainingBalance={remainingBalance}
                sourceNumberDisplay={sourceNumberDisplay}
                receiptType={receiptType}
            />
            {/* Shared print isolation: hides header/aside/nav so quick-print
                outputs the receipt document, not the application shell. */}
            <DocumentPrintStyles />
        </div>
    );
}

/**
 * The printable surface of the receipt. Pure render; takes the legacy
 * JSON shape so it can be exercised by unit tests without a server.
 */
export function ReceiptBody({
    tx,
    partner,
    settings = {},
    remainingBalance = 0,
    sourceNumberDisplay = '',
    receiptType,
}) {
    const isCustomer = receiptType === 'customer';
    const isSupplier = receiptType === 'supplier';

    // Title + amount-box label per type.
    const title = isCustomer
        ? 'سند تحصيل من عميل'
        : isSupplier
            ? 'سند سداد لمورد'
            : 'سند مالي';
    const amountLabel = isCustomer ? 'المبلغ المُستلم' : 'المبلغ المدفوع';
    const amountVerb = isCustomer ? 'يُصرف لـ / السيد' : 'يصرف إلى / السيد';
    const referenceLabel = isCustomer
        ? (tx.referenceType === 'Invoice' ? 'فاتورة مبيعات'
            : tx.referenceType === 'Debt' ? 'مديونية سابقة'
                : tx.referenceType === 'UnifiedCollection' ? 'تحصيل مجمع'
                    : 'تحصيل يدوي')
        : (tx.referenceType === 'PurchaseOrder' ? 'أمر شراء'
            : tx.referenceType === 'Debt' ? 'مديونية سابقة'
                : tx.referenceType === 'SalesReturn' ? 'مرتجع مبيعات'
                    : 'سداد يدوي');

    // Resolve the method label via the centralized map (fixes the
    // legacy `description.includes('بنك')` heuristic that broke
    // instapay / wallet).
    const methodInfo = getPaymentMethod(tx.method) || null;
    const methodLabel = methodInfo?.labelAr
        || (tx.method === 'credit' ? 'دفعة يدوية' : tx.method)
        || '—';
    const channelLabel = methodInfo?.channelLabelAr || '';
    const isElectronic = tx.method === 'instapay' || tx.method === 'wallet';
    // PII: the legacy endpoint may already supply a masked source;
    // we trust that and only fall back to client-side masking if the
    // source is provided unmasked AND the user is not owner/manager.
    const isOwner = (settings?.role === 'owner' || settings?.role === 'manager');
    const safeSource = isElectronic
        ? (sourceNumberDisplay || (tx.sourceNumber ? (isOwner ? tx.sourceNumber : maskSource(tx.sourceNumber)) : ''))
        : '';

    // Date / time.
    const dateStr = formatDateAr(tx.date);
    const timeStr = formatTimeAr(tx.date);
    const receiptNumber = tx.receiptNumber || `TR-${String(tx._id || '').slice(-6).toUpperCase()}`;

    return (
        <Card
            className="border-0 shadow-2xl relative overflow-hidden bg-white text-foreground print:shadow-none print:border print:border-border receipt-card"
            data-testid="receipt-card"
            data-receipt-type={receiptType}
        >
            <div className="absolute top-0 right-0 left-0 h-2 bg-primary print:hidden" />

            <CardContent className="p-8 sm:p-12 space-y-12">
                {/* Brand & Identity */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-8 border-b border-border pb-10">
                    <div className="space-y-4">
                        {settings.showLogo && settings.companyLogo ? (
                            <img
                                src={settings.companyLogo}
                                alt="Logo"
                                className="object-contain"
                                width={120}
                                height={60}
                            />
                        ) : (
                            <div
                                className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-primary/10"
                                data-testid="receipt-company-initial"
                            >
                                {(settings.companyName || 'N').charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1
                                className="text-3xl font-bold tracking-tight"
                                data-testid="receipt-company-name"
                            >
                                {settings.companyName || 'شركتكم'}
                            </h1>
                            <p
                                className="text-muted-foreground font-bold mt-1"
                                data-testid="receipt-title"
                            >
                                {title}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 text-right">
                        <div className="bg-muted50 px-6 py-3 rounded-2xl border border-border">
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest block mb-1">رقم السند</span>
                            <span
                                className="text-xl font-bold font-mono text-primary"
                                data-testid="receipt-number"
                            >
                                {receiptNumber}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 pr-6">
                            <div className="flex items-center justify-end gap-2 text-xs font-bold text-muted-foreground">
                                <span>التاريخ:</span>
                                <span className="font-mono text-foreground" data-testid="receipt-date">{dateStr}</span>
                            </div>
                            <div className="flex items-center justify-end gap-2 text-xs font-bold text-muted-foreground">
                                <span>الوقت:</span>
                                <span className="font-mono text-foreground" data-testid="receipt-time">{timeStr}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receipt Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Partner Info */}
                    <div className="space-y-6" data-testid="receipt-partner">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <div className="h-1 w-8 bg-secondary" /> {amountVerb}
                        </h3>
                        <div className="space-y-4 pr-4">
                            <div
                                className="text-2xl font-bold text-foreground"
                                data-testid="receipt-partner-name"
                            >
                                {partner?.name || (isCustomer ? 'عميل نقدي' : 'مورد نقدي')}
                            </div>
                            <div className="space-y-2">
                                {partner?.phone && (
                                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                                        <Phone className="h-4 w-4 text-primary/60" /> {partner.phone}
                                    </div>
                                )}
                                {partner?.address && (
                                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                                        <MapPin className="h-4 w-4 text-primary/60" /> {partner.address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Amount Box */}
                    <div
                        className={cn(
                            'rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-[160px]',
                            isCustomer ? 'bg-secondary' : 'bg-primary'
                        )}
                        data-testid="receipt-amount-box"
                    >
                        <CheckCircle2 className="absolute -right-8 -bottom-8 h-48 w-48 opacity-10" />

                        <span
                            className="text-xs font-bold uppercase tracking-widest text-white/80 block mb-2 relative z-10"
                            data-testid="receipt-amount-label"
                        >
                            {amountLabel}
                        </span>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span
                                className="text-5xl font-bold tracking-tighter font-mono"
                                data-testid="receipt-amount"
                            >
                                {formatMoney(tx.amount)}
                            </span>
                            <span className="text-lg font-bold italic">ج.م</span>
                        </div>
                        <div
                            className="mt-6 pt-4 border-t border-white/10 relative z-10 flex items-center gap-2"
                            data-testid="receipt-method"
                        >
                            <div className="h-2 w-2 rounded-full bg-success" />
                            <span className="text-xs font-bold text-white/90">
                                طريقة الدفع: {methodLabel}
                                {channelLabel ? ` — ${channelLabel}` : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description & Balance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6 bg-muted50 p-8 rounded-3xl border border-border">
                        <div className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">وذلك عـن / البيان</span>
                            <p
                                className="text-xl font-bold leading-relaxed pr-2 border-r-4 border-primary/20"
                                data-testid="receipt-description"
                            >
                                {tx.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 mt-6 border-t border-border/50">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">مرجع العملية</span>
                                <span
                                    className="font-bold text-foreground"
                                    data-testid="receipt-reference-label"
                                >
                                    {referenceLabel}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">مُحرر السند</span>
                                <span className="font-bold text-foreground">
                                    {tx.createdBy?.name || 'النظام'}
                                </span>
                            </div>
                        </div>

                        {isElectronic && safeSource && (
                            <div className="pt-6 border-t border-border/50">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">رقم التحويل</span>
                                <span
                                    className="font-mono font-bold text-foreground"
                                    data-testid="receipt-source-number"
                                >
                                    {safeSource}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Balance Info */}
                    <div
                        className={cn(
                            'p-8 rounded-3xl border flex flex-col justify-center items-center text-center',
                            isCustomer
                                ? 'bg-destructive/10 border-destructive/30'
                                : 'bg-emerald-50 border-emerald-200'
                        )}
                        data-testid="receipt-balance"
                    >
                        <span
                            className={cn(
                                'text-xs font-bold uppercase tracking-widest block mb-2',
                                isCustomer ? 'text-destructive' : 'text-emerald-800'
                            )}
                        >
                            {isCustomer ? 'إجمالي الرصيد المتبقي للحساب' : 'إجمالي الرصيد المتبقي للمورد'}
                        </span>
                        <div
                            className={cn(
                                'text-3xl font-bold font-mono',
                                isCustomer ? 'text-destructive' : 'text-emerald-800'
                            )}
                            data-testid="receipt-balance-value"
                        >
                            {formatMoney(remainingBalance)}
                            <span className="text-xs font-bold mr-1 italic">ج.م</span>
                        </div>
                        <p
                            className={cn(
                                'text-xs font-bold mt-2',
                                isCustomer ? 'text-destructive' : 'text-emerald-700'
                            )}
                        >
                            {isCustomer
                                ? 'يرجى الالتزام بمواعيد السداد المحددة'
                                : 'تم تحديث رصيد المورد'}
                        </p>
                    </div>
                </div>

                {/* Footer / Signature Area */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-12 pt-12 border-t border-border relative">
                    <div className="absolute left-[50%] top-[-50px] -translate-x-[50%] opacity-20 hidden print:block pointer-events-none">
                        <div className="w-40 h-40 rounded-full border-8 border-primary flex flex-col items-center justify-center p-4 text-center">
                            <span className="text-xs font-bold uppercase text-primary leading-none mb-1">{isCustomer ? 'مستلم / PAID' : 'مدفوع / PAID'}</span>
                            <div className="h-px bg-primary w-full my-2" />
                            <span className="text-xs font-bold text-primary leading-tight">{settings.companyName}</span>
                            <div className="h-px bg-primary w-full my-2" />
                            <span className="text-xs font-bold text-primary">{dateStr}</span>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-sm">
                        <h4 className="text-sm font-bold text-foreground">معلومات الاتصال</h4>
                        <div className="grid grid-cols-1 gap-2 text-xs font-bold text-muted-foreground">
                            {settings.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {settings.phone}</div>}
                            {settings.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {settings.email}</div>}
                            {settings.address && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {settings.address}</div>}
                        </div>
                    </div>

                    <div className="w-48 h-48 rounded-full border-[6px] border-border/50 flex flex-col items-center justify-center p-6 text-center rotate-6 scale-90 sm:scale-100">
                        <div className="text-primary font-bold text-lg leading-tight mb-2">{settings.companyName}</div>
                        <div className="h-[2px] w-12 bg-secondary my-1" />
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Certified Receipt</div>
                        <div className="text-xs font-bold text-muted-foreground mt-1 italic">محرر إلكترونياً</div>
                    </div>

                    <div className="text-center space-y-8 min-w-[200px]">
                        <div className="h-20 flex items-center justify-center opacity-30 italic font-medium pt-8">
                            <span className="border-b-2 border-dotted border-border px-12">التوقيع والختم</span>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground italic max-w-[200px]">هذا السند مُحرر إلكترونياً ولا يتطلب ختم يدوي في حالة وجود رمز التحقق</p>
                    </div>
                </div>
            </CardContent>

            <div className="bg-muted50 p-4 text-center border-t border-border hidden print:block">
                <p className="text-xs font-bold text-muted-foreground">{settings.companyName} - نظام إدارة المبيعات المطور ®</p>
            </div>
        </Card>
    );
}

// Re-exports for tests
export { detectReceiptType, formatMoney, formatDateAr, formatTimeAr };

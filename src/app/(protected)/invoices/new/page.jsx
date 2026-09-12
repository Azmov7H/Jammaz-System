'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Save, Printer, AlertTriangle, Loader2, Wallet, CreditCard, Receipt, Calendar as CalendarIcon, Store, Warehouse } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import { useCreateInvoice } from '@/hooks/useInvoices';

import { InvoiceCustomerSelect } from '@/components/invoices/InvoiceCustomerSelect';
import { InvoiceItemsManager } from '@/components/invoices/InvoiceItemsManager';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { PaymentMethodSelect } from '@/components/common/PaymentMethodSelect';
import { SourceNumberField } from '@/components/financial/SourceNumberField';

export default function NewInvoicePage() {
    const router = useRouter();

    // Invoice Items
    const [items, setItems] = useState([]);
    const { disarm } = useUnsavedGuard(items.length > 0);

    // Customer State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [currentPriceType, setCurrentPriceType] = useState('retail');

    // Credit-balance handling on invoice creation. `applyCredit` means
    // "deduct up to the customer's creditBalance from this invoice's
    // subtotal" (the existing field `usedCreditBalance` on Invoice).
    // When false, the full invoice amount stays as an outstanding debt
    // on the customer account (default behavior, no extra bookkeeping).
    const [applyCredit, setApplyCredit] = useState(false);
    const [creditToUse, setCreditToUse] = useState(0);

    // Payment State
    const [paymentType, setPaymentType] = useState('cash');
    const [dueDate, setDueDate] = useState('');
    const [shippingCompany, setShippingCompany] = useState('');
    const [sourceNumber, setSourceNumber] = useState('');

    // Shortage Reporting
    const [shortageDialog, setShortageDialog] = useState({ open: false, product: null });
    const [reportNote, setReportNote] = useState('');

    // Navigation state to prevent duplicate submissions during navigation
    const [isNavigating, setIsNavigating] = useState(false);

    const createInvoiceMutation = useCreateInvoice();

    // Effect to update prices when customer price type changes
    useEffect(() => {
        if (items.length > 0) {
            setItems(prevItems => prevItems.map(item => {
                const newPrice = getProductPrice(item, currentPriceType);
                if (item.unitPrice !== newPrice) {
                    return { ...item, unitPrice: newPrice };
                }
                return item;
            }));

            if (items.some(i => i.retailPrice)) {
                toast.info('تم تحديث أسعار المنتجات بناءً على نوع العميل');
            }
        }
    }, [currentPriceType]);

    const getProductPrice = (product, type) => {
        if (type === 'wholesale') return product.wholesalePrice || product.retailPrice || 0;
        if (type === 'special') return product.specialPrice || product.retailPrice || 0;
        return product.retailPrice || product.sellPrice || 0;
    };

    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setCustomerName(customer.name);
        setCustomerPhone(customer.phone);
        setCurrentPriceType(customer.priceType || 'retail');
        // Reset credit-balance handling on every customer change.
        setApplyCredit(false);
        setCreditToUse(0);
        toast.success(`تم اختيار العميل: ${customer.name}`);
    };

    const handleCustomerClear = () => {
        setSelectedCustomer(null);
        setCustomerName('');
        setCustomerPhone('');
        setCurrentPriceType('retail');
    };

    const handleReportShortage = async () => {
        if (!shortageDialog.product) return;
        try {
            const res = await fetch('/api/reports/shortage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: shortageDialog.product._id,
                    productName: shortageDialog.product.name,
                    requestedQty: 1,
                    availableQty: shortageDialog.product.shopQty || shortageDialog.product.stockQty || 0,
                    notes: reportNote
                })
            });

            if (res.ok) {
                toast.success('تم إرسال بلاغ النقص للمالك');
                setShortageDialog({ open: false, product: null });
                setReportNote('');
            } else {
                toast.error('فشل الإبلاغ');
            }
        } catch (error) {
            toast.error('خطأ في النظام');
        }
    };

    const handleSubmit = () => {
        // Prevent submission if already pending or navigating
        if (createInvoiceMutation.isPending || isNavigating) {
            toast.warning('جاري معالجة الفاتورة، يرجى الانتظار...');
            return;
        }

        if (items.length === 0) {
            toast.error('الفاتورة فارغة');
            return;
        }

        if (paymentType === 'credit' && !selectedCustomer) {
            toast.error('يجب اختيار عميل للفاتورة الآجلة');
            return;
        }

        if ((paymentType === 'instapay' || paymentType === 'wallet') && !sourceNumber.trim()) {
            toast.error('رقم حساب التحويل مطلوب');
            return;
        }

        const invoiceData = {
            items,
            customerName: customerName || 'عميل نقدي',
            customerPhone,
            customerId: selectedCustomer?._id,
            paymentType,
            dueDate,
            shippingCompany,
            sourceNumber,
            // FIN-CREDIT-CHOICE: include the credit-balance deduction only when
            // the user explicitly opted in. Default (false) leaves the full
            // invoice amount as an outstanding debt on the customer account.
            usedCreditBalance: effectiveCreditUsed
        };

        createInvoiceMutation.mutate(invoiceData, {
            onSuccess: (invoice) => {
                // API returns invoice directly (not wrapped in data.invoice)
                const invoiceId = invoice?._id;

                if (invoiceId) {
                    // Set navigating state to keep button disabled during navigation
                    setIsNavigating(true);
                    disarm();
                    toast.success('تم حفظ الفاتورة بنجاح');

                    // Navigate to invoice detail page for printing
                    router.push(`/invoices/${invoiceId}`);
                } else {
                    // If no invoiceId, something went wrong
                    setIsNavigating(false);
                    toast.error('خطأ: لم يتم إرجاع معرف الفاتورة');
                }
            },
            onError: (error) => {
                // Reset navigating state on error
                setIsNavigating(false);
                // Error toast is already shown by useCreateInvoice's onError
                // No need to show it again here
            }
        });
    };

    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const customerCredit = selectedCustomer?.creditBalance || 0;
    const effectiveCreditUsed = applyCredit ? Math.min(creditToUse, subtotal, customerCredit) : 0;

    // Default Source State (for new items)
    const [defaultSource, setDefaultSource] = useState('shop');

    return (
        <div className="space-y-8 animate-fade-in-up" dir="rtl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
                        <Receipt className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">إنشاء فاتورة جديدة</h1>
                        <p className="text-muted-foreground font-medium mt-1">إصدار عملية بيع جديدة وتحديث المخزون تلقائياً</p>
                    </div>
                </div>

                {/* Global Source Toggle */}
                <div className="flex bg-card border border-white/5 rounded-xl p-1 shadow-sm">
                    <button
                        onClick={() => setDefaultSource('shop')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                            defaultSource === 'shop'
                                ? "bg-success/10 text-success shadow-sm"
                                : "text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        <Store className="w-4 h-4" />
                        بيع من المحل
                    </button>
                    <button
                        onClick={() => setDefaultSource('warehouse')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                            defaultSource === 'warehouse'
                                ? "bg-info/10 text-info shadow-sm"
                                : "text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        <Warehouse className="w-4 h-4" />
                        بيع من المخزن
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-1"
                >
                    <InvoiceCustomerSelect
                        selectedCustomer={selectedCustomer}
                        onSelect={handleCustomerSelect}
                        onClear={handleCustomerClear}
                        customerName={customerName}
                        setCustomerName={setCustomerName}
                        customerPhone={customerPhone}
                        setCustomerPhone={setCustomerPhone}
                        shippingCompany={shippingCompany}
                        setShippingCompany={setShippingCompany}
                        disabled={createInvoiceMutation.isPending}
                    />
                </motion.div>

                {/* Items Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2"
                >
                    <InvoiceItemsManager
                        items={items}
                        setItems={setItems}
                        defaultSource={defaultSource}
                        onReportShortage={(product) => setShortageDialog({ open: true, product })}
                    />
                </motion.div>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-start-2 lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card border border-white/5 p-8 rounded-[2.5rem] shadow-custom-xl space-y-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex justify-between items-center text-lg">
                            <span className="text-muted-foreground font-bold">المجموع الفرعي:</span>
                            <span className="font-bold text-foreground">{subtotal.toLocaleString()} ج.م</span>
                        </div>

                        {customerCredit > 0 && (
                            <motion.div
                                key="credit-balance-block"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 space-y-4"
                                data-testid="credit-balance-block"
                            >
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-2 text-emerald-800">
                                        <div className="p-1.5 bg-emerald-200 rounded-lg">
                                            <Wallet className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold">رصيد متاح للعميل:</span>
                                    </div>
                                    <span className="font-bold text-emerald-900 text-lg">
                                        {customerCredit.toLocaleString()} ج.م
                                    </span>
                                </div>

                                <p className="text-sm text-emerald-900 leading-relaxed">
                                    لدى العميل رصيد دائن مسجّل. اختر كيف تريد معالجة هذا الرصيد في هذه الفاتورة:
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Option A — Deduct from balance */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setApplyCredit(true);
                                            setCreditToUse(Math.min(subtotal, customerCredit));
                                        }}
                                        className={cn(
                                            "text-right rounded-xl p-4 border-2 transition-all",
                                            applyCredit
                                                ? "bg-emerald-600 text-white border-emerald-700 shadow-lg"
                                                : "bg-white text-emerald-900 border-emerald-200 hover:border-emerald-400"
                                        )}
                                        data-testid="credit-option-deduct"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 mt-1 flex items-center justify-center flex-shrink-0",
                                                applyCredit ? "border-white bg-white" : "border-emerald-600"
                                            )}>
                                                {applyCredit && <div className="h-2 w-2 rounded-full bg-emerald-600" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-base">خصم من رصيد العميل</p>
                                                <p className={cn("text-xs mt-1 leading-relaxed", applyCredit ? "opacity-90" : "text-emerald-700")}>
                                                    يُخصم من إجمالي الفاتورة ويُسجَّل المبلغ المتبقي (إن وُجد) كمتبقيّ للعميل. مناسب عندما تريد إغلاق جزء من الفاتورة نقداً فعلاً.
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Option B — Keep as outstanding */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setApplyCredit(false);
                                            setCreditToUse(0);
                                        }}
                                        className={cn(
                                            "text-right rounded-xl p-4 border-2 transition-all",
                                            !applyCredit
                                                ? "bg-amber-500 text-white border-amber-600 shadow-lg"
                                                : "bg-white text-amber-900 border-amber-200 hover:border-amber-400"
                                        )}
                                        data-testid="credit-option-keep"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 mt-1 flex items-center justify-center flex-shrink-0",
                                                !applyCredit ? "border-white bg-white" : "border-amber-600"
                                            )}>
                                                {!applyCredit && <div className="h-2 w-2 rounded-full bg-amber-600" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-base">الإبقاء كحساب جاري</p>
                                                <p className={cn("text-xs mt-1 leading-relaxed", !applyCredit ? "opacity-90" : "text-amber-700")}>
                                                    الفاتورة تبقى كاملة على حساب العميل كدين مستحق. الرصيد المتاح يبقى كما هو لاستخدامه في فواتير لاحقة. مناسب لآجل الموردين.
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {applyCredit && effectiveCreditUsed > 0 && (
                                    <div className="flex justify-between items-center pt-3 border-t border-emerald-300 text-emerald-900">
                                        <span className="text-sm font-bold">سيتم خصم:</span>
                                        <span className="text-xl font-bold">-{effectiveCreditUsed.toLocaleString()} ج.م</span>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground/60 mr-1">طريقة السداد</Label>
                            <div className="space-y-3">
                                <PaymentMethodSelect
                                    value={paymentType === 'credit' ? undefined : paymentType}
                                    onValueChange={setPaymentType}
                                    methods={['cash', 'wallet', 'instapay', 'check']}
                                    disabled={createInvoiceMutation.isPending || paymentType === 'credit'}
                                    placeholder="اختر وسيلة الدفع"
                                />
                                <Button
                                    type="button"
                                    variant={paymentType === 'credit' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('credit')}
                                    disabled={createInvoiceMutation.isPending}
                                    className={cn(
                                        "w-full h-14 rounded-2xl font-bold transition-all border-2",
                                        paymentType === 'credit'
                                            ? "bg-warning hover:bg-warning shadow-lg shadow-warning/20 border-warning/50"
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    <CreditCard className="ml-2 h-5 w-5" />
                                    آجل (دفع مؤجل)
                                </Button>
                            </div>
                        </div>

                        {paymentType === 'credit' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3"
                            >
                                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground/60 mr-1">تاريخ الاستحقاق المتوقع</Label>
                                <div className="relative group">
                                    <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary h-5 w-5 z-10 transition-colors" />
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="h-14 pr-12 rounded-2xl bg-white/5 border-white/10 focus-visible:bg-white/10 font-bold transition-all"
                                    />
                                </div>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                        >
                            <SourceNumberField
                                autoFocus
                                method={paymentType}
                                value={sourceNumber}
                                onChange={setSourceNumber}
                                disabled={createInvoiceMutation.isPending}
                            />
                        </motion.div>

                        <div className="h-px bg-white/5 my-2"></div>

                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold uppercase tracking-tight">الإجمالي النهائي:</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-primary tracking-tighter">
                                    {Math.max(0, subtotal - effectiveCreditUsed).toLocaleString()}
                                </span>
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">جنيه</span>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 font-bold text-xl shadow-colored hover:scale-[1.02] active:scale-[0.98] transition-all gap-3"
                            onClick={handleSubmit}
                            disabled={createInvoiceMutation.isPending || isNavigating || items.length === 0}
                        >
                            {(createInvoiceMutation.isPending || isNavigating) ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    {isNavigating ? 'جاري التحويل للفاتورة...' : 'جاري الحفظ...'}
                                </>
                            ) : (
                                <>
                                    <Save size={24} /> حفظ وإصدار الفاتورة
                                </>
                            )}
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Shortage Reporting Dialog */}
            <Dialog open={shortageDialog.open} onOpenChange={(open) => { if (!open) setShortageDialog({ ...shortageDialog, open: false }); }}>
                <DialogContent className="sm:max-w-[425px] glass-card border-white/10 p-0 rounded-[2rem] overflow-hidden" dir="rtl">
                    <div className="bg-destructive p-6 text-white text-center">
                        <DialogHeader>
                            <div className="mx-auto w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3 text-white backdrop-blur-md">
                                <AlertTriangle className="h-7 w-7" />
                            </div>
                            <DialogTitle className="text-xl font-bold">تنبيه: الكمية غير متوفرة</DialogTitle>
                            <DialogDescription className="text-destructive font-medium">
                                المنتج <strong>{shortageDialog.product?.name}</strong> غير متوفر حالياً في المحل.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-4 bg-secondary">
                        <p className="text-sm text-muted-foreground font-medium">هل تود إبلاغ المالك ومدير المخزن عن هذا النقص؟</p>
                        <div className="space-y-2">
                            <Label className="font-bold">ملاحظات إضافية (اختياري)</Label>
                            <Input
                                placeholder="مثال: العميل طلب كمية كبيرة..."
                                value={reportNote}
                                onChange={e => setReportNote(e.target.value)}
                                className="h-11 rounded-xl bg-white/5 border-white/5"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-0 bg-secondary gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShortageDialog({ ...shortageDialog, open: false })}
                            className="flex-1 h-11 rounded-xl bg-white/5 border-white/10"
                        >
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleReportShortage}
                            className="flex-1 h-11 rounded-xl bg-destructive hover:bg-destructive text-white font-bold"
                        >
                            إبلاغ عن نقص
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

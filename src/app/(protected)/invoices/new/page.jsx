'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Save, Printer, AlertTriangle, Loader2, Receipt, Banknote, Wallet, CreditCard, Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import { useCreateInvoice } from '@/hooks/useInvoices';

import { InvoiceCustomerSelect } from '@/components/invoices/InvoiceCustomerSelect';
import { InvoiceItemsManager } from '@/components/invoices/InvoiceItemsManager';

export default function NewInvoicePage() {
    const router = useRouter();

    // Invoice Items
    const [items, setItems] = useState([]);

    // Customer State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [currentPriceType, setCurrentPriceType] = useState('retail');

    // Payment State
    const [paymentType, setPaymentType] = useState('cash');
    const [dueDate, setDueDate] = useState('');

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

        const invoiceData = {
            items,
            customerName: customerName || 'Walk-in',
            customerPhone,
            customerId: selectedCustomer?._id,
            paymentType,
            dueDate
        };

        createInvoiceMutation.mutate(invoiceData, {
            onSuccess: (invoice) => {
                // API returns invoice directly (not wrapped in data.invoice)
                const invoiceId = invoice?._id;

                if (invoiceId) {
                    // Set navigating state to keep button disabled during navigation
                    setIsNavigating(true);
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
                        <h1 className="text-3xl font-black tracking-tight text-foreground">إنشاء فاتورة جديدة</h1>
                        <p className="text-muted-foreground font-medium mt-1">إصدار عملية بيع جديدة وتحديث المخزون تلقائياً</p>
                    </div>
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
                            <span className="font-black text-foreground">{subtotal.toLocaleString()} ج.م</span>
                        </div>

                        {customerCredit > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex justify-between items-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                                        <Wallet className="w-4 h-4" />
                                    </div>
                                    <span className="font-black">خصم رصيد سابق:</span>
                                </div>
                                <span className="font-black">-{Math.min(subtotal, customerCredit).toLocaleString()} ج.م</span>
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground/60 mr-1">طريقة السداد</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <Button
                                    variant={paymentType === 'cash' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('cash')}
                                    disabled={createInvoiceMutation.isPending}
                                    className={cn(
                                        "h-14 rounded-2xl font-black transition-all border-2",
                                        paymentType === 'cash'
                                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 border-emerald-500/50"
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    <Banknote className="ml-2 h-5 w-5" />
                                    نقدي
                                </Button>
                                <Button
                                    variant={paymentType === 'bank' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('bank')}
                                    disabled={createInvoiceMutation.isPending}
                                    className={cn(
                                        "h-14 rounded-2xl font-black transition-all border-2",
                                        paymentType === 'bank'
                                            ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 border-blue-500/50"
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    <Wallet className="ml-2 h-5 w-5" />
                                    بنكي
                                </Button>
                                <Button
                                    variant={paymentType === 'credit' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('credit')}
                                    disabled={createInvoiceMutation.isPending}
                                    className={cn(
                                        "h-14 rounded-2xl font-black transition-all border-2",
                                        paymentType === 'credit'
                                            ? "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/20 border-amber-500/50"
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    <CreditCard className="ml-2 h-5 w-5" />
                                    آجل
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
                                <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground/60 mr-1">تاريخ الاستحقاق المتوقع</Label>
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

                        <div className="h-px bg-white/5 my-2"></div>

                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-black uppercase tracking-tight">الإجمالي النهائي:</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-primary tracking-tighter">
                                    {Math.max(0, subtotal - customerCredit).toLocaleString()}
                                </span>
                                <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">جنيه</span>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 font-black text-xl shadow-colored hover:scale-[1.02] active:scale-[0.98] transition-all gap-3"
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
                    <div className="bg-red-600 p-6 text-white text-center">
                        <DialogHeader>
                            <div className="mx-auto w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3 text-white backdrop-blur-md">
                                <AlertTriangle className="h-7 w-7" />
                            </div>
                            <DialogTitle className="text-xl font-black">تنبيه: الكمية غير متوفرة</DialogTitle>
                            <DialogDescription className="text-red-100 font-medium">
                                المنتج <strong>{shortageDialog.product?.name}</strong> غير متوفر حالياً في المحل.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-4 bg-[#0f172a]">
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
                    <DialogFooter className="p-6 pt-0 bg-[#0f172a] gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShortageDialog({ ...shortageDialog, open: false })}
                            className="flex-1 h-11 rounded-xl bg-white/5 border-white/10"
                        >
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleReportShortage}
                            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                            إبلاغ عن نقص
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

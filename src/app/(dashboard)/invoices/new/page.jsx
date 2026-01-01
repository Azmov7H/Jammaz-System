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
import { cn } from '@/lib/utils';
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
            onSuccess: (status) => {
                // data from useCreateInvoice is now data.data which is { invoice, message }
                const invoiceId = status.invoice?._id;
                if (invoiceId) router.push(`/invoices/${invoiceId}`);
            }
        });
    };

    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const customerCredit = selectedCustomer?.creditBalance || 0;

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-6" dir="rtl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
            >
                <div className="p-3 bg-purple-500/10 rounded-2xl">
                    <Receipt className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight">فاتورة مبيعات جديدة</h1>
                    <p className="text-muted-foreground font-medium">إنشاء وإصدار فاتورة جديدة</p>
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
                        className="glass-card p-6 rounded-[2rem] bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 space-y-4"
                    >
                        <div className="flex justify-between text-base">
                            <span className="text-muted-foreground font-medium">المجموع الفرعي:</span>
                            <span className="font-bold">{subtotal.toLocaleString()} ج.م</span>
                        </div>

                        {customerCredit > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex justify-between text-sm glass-card p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                            >
                                <span className="text-emerald-500 font-bold">خصم رصيد مرتجع سابق:</span>
                                <span className="text-emerald-500 font-bold">-{Math.min(subtotal, customerCredit).toLocaleString()} ج.م</span>
                            </motion.div>
                        )}

                        <div className="space-y-3">
                            <Label className="font-bold">نوع الفاتورة</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <Button
                                    variant={paymentType === 'cash' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('cash')}
                                    className={cn(
                                        "h-12 rounded-xl font-bold transition-all",
                                        paymentType === 'cash'
                                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <Banknote className="ml-2 h-4 w-4" />
                                    نقدي
                                </Button>
                                <Button
                                    variant={paymentType === 'bank' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('bank')}
                                    className={cn(
                                        "h-12 rounded-xl font-bold transition-all",
                                        paymentType === 'bank'
                                            ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <Wallet className="ml-2 h-4 w-4" />
                                    بنكي
                                </Button>
                                <Button
                                    variant={paymentType === 'credit' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('credit')}
                                    className={cn(
                                        "h-12 rounded-xl font-bold transition-all",
                                        paymentType === 'credit'
                                            ? "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/20"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <CreditCard className="ml-2 h-4 w-4" />
                                    آجل
                                </Button>
                            </div>
                        </div>

                        {paymentType === 'credit' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                            >
                                <Label className="font-bold">تاريخ الاستحقاق</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="h-12 pr-10 rounded-xl bg-white/5 border-white/5"
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div className="border-t border-white/10 my-4"></div>

                        <div className="flex justify-between items-center">
                            <span className="text-xl font-black">الإجمالي النهائي:</span>
                            <span className="text-3xl font-black text-purple-500">
                                {Math.max(0, subtotal - customerCredit).toLocaleString()}
                                <span className="text-base text-muted-foreground mr-2">ج.م</span>
                            </span>
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-14 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-lg shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]"
                            onClick={handleSubmit}
                            disabled={createInvoiceMutation.isPending || items.length === 0}
                        >
                            {createInvoiceMutation.isPending ? (
                                <>
                                    <Loader2 className="animate-spin ml-2" /> جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Save className="ml-2" size={20} /> إصدار الفاتورة
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

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowRight, Trash2, ArrowRightLeft, Loader2, Wallet, Package, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/utils';

export default function InvoiceViewPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [invoice, setInvoice] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // Return State
    const [showReturnDialog, setShowReturnDialog] = useState(false);
    const [returnItems, setReturnItems] = useState({});
    const [refundMethod, setRefundMethod] = useState('cash');
    const [isReturning, setIsReturning] = useState(false);
    const [returns, setReturns] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, setRes, retRes] = await Promise.all([
                    fetch(`/api/invoices/${id}`),
                    fetch(`/api/settings/invoice-design`),
                    fetch(`/api/invoices/${id}/returns`)
                ]);

                const invData = await invRes.json();
                const setData = await setRes.json();
                const retData = await retRes.json();

                setInvoice(invData.data?.invoice || invData.invoice);
                setSettings(setData.data || setData);
                setReturns(retData.data?.returns || retData.returns || []);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const handleReturnSubmit = async () => {
        setIsReturning(true);
        try {
            const itemsToReturn = Object.entries(returnItems)
                .filter(([_, qty]) => qty > 0)
                .map(([invoiceItemId, qty]) => ({ invoiceItemId, qty }));

            if (itemsToReturn.length === 0) {
                toast.error('يجب تحديد كمية واحدة على الأقل');
                setIsReturning(false);
                return;
            }

            const res = await fetch(`/api/invoices/${id}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: itemsToReturn,
                    refundMethod: refundMethod
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('تم استرجاع المنتجات بنجاح');
                setShowReturnDialog(false);
                window.location.reload();
            } else {
                toast.error(data.error || 'حدث خطأ أثناء الارتجاع');
            }
        } catch (error) {
            console.error(error);
            toast.error('خطأ في الاتصال');
        } finally {
            setIsReturning(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟ سيتم استرجاع الكميات.')) return;

        try {
            const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('تم حذف الفاتورة بنجاح');
                router.push('/invoices');
            } else {
                toast.error('حدث خطأ أثناء الحذف');
            }
        } catch (error) {
            console.error(error);
            toast.error('خطأ في الاتصال');
        }
    };

    if (loading) return <div className="text-center py-20">جاري تحميل الفاتورة...</div>;
    if (!invoice) return <div className="text-center py-20 text-red-500">الفاتورة غير موجودة</div>;

    const primaryColor = settings?.primaryColor || '#1B3C73';
    const headerBgColor = settings?.headerBgColor || '#1B3C73';

    return (
        <div className="p-6 max-w-4xl mx-auto pb-20">
            {/* Action Bar (Hidden in Print) */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <Button variant="outline" onClick={() => router.back()} className="gap-2">
                    <ArrowRight size={16} /> العودة
                </Button>

                <div className="flex gap-2">
                    <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="gap-2 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 shadow-sm hover-lift">
                                <ArrowRightLeft size={16} /> استرجاع منتجات
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl bg-slate-950/90 backdrop-blur-2xl border-white/5 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-0 gap-0 overflow-hidden rounded-[2.5rem]" dir="rtl">
                            <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-l from-amber-500 via-amber-400 to-amber-500 opacity-80" />

                            <div className="p-8 pb-4">
                                <DialogHeader>
                                    <div className="flex items-center justify-between">
                                        <DialogTitle className="text-2xl font-black flex items-center gap-4 text-white">
                                            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-inner">
                                                <ArrowRightLeft className="text-amber-500" size={24} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span>استرجاع منتجات معتمدة</span>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">الفاتورة #{invoice.number}</span>
                                            </div>
                                        </DialogTitle>
                                        <div className="text-left hidden md:block">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">تاريخ الفاتورة</span>
                                            <span className="text-xs font-bold text-slate-300 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                                {format(new Date(invoice.date), 'd MMMM yyyy', { locale: ar })}
                                            </span>
                                        </div>
                                    </div>
                                </DialogHeader>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col">
                                <ScrollArea className="flex-1 max-h-[320px] px-8 py-2">
                                    <div className="space-y-4 pb-8">
                                        {invoice.items.map((item, i) => {
                                            const itemId = item._id; // Use unique invoice item ID
                                            const currentReturnQty = returnItems[itemId] || 0;
                                            const isSelected = currentReturnQty > 0;

                                            return (
                                                <motion.div
                                                    key={i}
                                                    initial={false}
                                                    animate={{
                                                        scale: isSelected ? 1.01 : 1,
                                                        borderColor: isSelected ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                                                        backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.03)' : 'rgba(255, 255, 255, 0.02)'
                                                    }}
                                                    className={cn(
                                                        "group border rounded-3xl p-5 transition-all duration-300 relative overflow-hidden",
                                                    )}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className={cn(
                                                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                                isSelected ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-white/5 text-slate-500"
                                                            )}>
                                                                <Package size={20} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <h4 className="font-black text-white text-lg group-hover:text-amber-400 transition-colors uppercase tracking-tight">
                                                                    {item.productName || item.name || 'منتج'}
                                                                </h4>
                                                                <div className="flex items-center gap-3 text-xs font-bold mt-1">
                                                                    <span className="text-slate-500">سعر الوحدة:</span>
                                                                    <span className="text-slate-300">{item.unitPrice.toLocaleString()} ج.م</span>
                                                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                                    <span className="text-slate-500">المباع:</span>
                                                                    <Badge variant="outline" className="h-5 px-2 bg-white/5 border-white/10 text-slate-300">{item.qty}</Badge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-center md:items-end gap-3">
                                                            <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-10 w-10 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
                                                                    onClick={() => {
                                                                        if (currentReturnQty > 0) {
                                                                            setReturnItems(prev => ({ ...prev, [itemId]: currentReturnQty - 1 }));
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="text-2xl font-black leading-none">-</span>
                                                                </Button>

                                                                <div className="w-14 text-center">
                                                                    <span className={cn(
                                                                        "text-2xl font-black tracking-tighter transition-all duration-300",
                                                                        isSelected ? "text-amber-500 scale-110" : "text-slate-600"
                                                                    )}>
                                                                        {currentReturnQty}
                                                                    </span>
                                                                </div>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-10 w-10 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
                                                                    onClick={() => {
                                                                        if (currentReturnQty < item.qty) {
                                                                            setReturnItems(prev => ({ ...prev, [itemId]: currentReturnQty + 1 }));
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="text-xl font-black leading-none">+</span>
                                                                </Button>
                                                            </div>
                                                            {isSelected && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest"
                                                                >
                                                                    سيتم استرداد {(currentReturnQty * item.unitPrice).toLocaleString()} ج.م
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Background Accent for Selected */}
                                                    {isSelected && (
                                                        <motion.div
                                                            layoutId={`accent-${i}`}
                                                            className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none"
                                                        />
                                                    )}
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="p-8 pt-6 bg-slate-900/50 border-t border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-5 space-y-4">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mr-1">
                                                <Wallet size={12} className="text-amber-500" /> طريقة رد المبلغ
                                            </Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setRefundMethod('cash')}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group/btn",
                                                        refundMethod === 'cash'
                                                            ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                                                            : "bg-white/20 border-transparent text-slate-400 hover:bg-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-xl transition-all",
                                                        refundMethod === 'cash' ? "bg-amber-500 text-white" : "bg-white/5 group-hover/btn:bg-white/10"
                                                    )}>
                                                        <Banknote size={16} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">خزينة نقداً</span>
                                                </button>
                                                <button
                                                    onClick={() => setRefundMethod('customerBalance')}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group/btn",
                                                        refundMethod === 'customerBalance'
                                                            ? "bg-blue-500/10 border-blue-500/50 text-blue-500"
                                                            : "bg-white/20 border-transparent text-slate-400 hover:bg-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-xl transition-all",
                                                        refundMethod === 'customerBalance' ? "bg-blue-500 text-white" : "bg-white/5 group-hover/btn:bg-white/10"
                                                    )}>
                                                        <Wallet size={16} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">محفظة العميل</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-7 flex flex-col justify-end">
                                        <div className="bg-slate-950/80 rounded-3xl p-6 border border-white/5 shadow-inner relative overflow-hidden group">
                                            <div className="flex justify-between items-center relative z-10">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">صافي القيمة المستردة</span>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-4xl font-black text-amber-400 tracking-tighter">
                                                            {
                                                                invoice.items.reduce((sum, item) => {
                                                                    const qty = returnItems[item.productId?._id || item.productId] || 0;
                                                                    return sum + (qty * item.unitPrice);
                                                                }, 0).toLocaleString()
                                                            }
                                                        </span>
                                                        <span className="text-sm font-black text-slate-500">ج.م</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={handleReturnSubmit}
                                                    disabled={isReturning || Object.values(returnItems).every(q => q === 0)}
                                                    className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2 disabled:opacity-50 disabled:scale-100"
                                                >
                                                    {isReturning ? <Loader2 className="animate-spin" /> : (
                                                        <>
                                                            <span>اعتماد المرتجع</span>
                                                            <ArrowRight className="w-5 h-5 rotate-180" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={handlePrint} className="gap-2 bg-primary">
                        <Printer size={16} /> طباعة / PDF
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg">
                        <Trash2 size={16} /> حذف
                    </Button>
                </div>
            </div>

            {/* Invoice Container */}
            <div className="bg-white border text-slate-800 p-10 rounded-xl shadow-2xl print:shadow-none print:border-none print:p-0" id="invoice-area">

                {/* Header with Logo */}
                <div
                    className="flex justify-between items-start pb-6 mb-6"
                    style={{ borderBottom: `2px solid ${primaryColor}` }}
                >
                    <div className="flex items-center gap-4">
                        {settings?.showLogo && (
                            <div
                                className="w-20 h-20 flex flex-col items-center justify-center rounded-xl shadow-lg border-2"
                                style={{
                                    backgroundColor: primaryColor,
                                    color: 'white',
                                    borderColor: primaryColor
                                }}
                            >
                                {settings.companyLogo ? (
                                    <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                                ) : (
                                    <>
                                        <span className="text-3xl font-bold">{settings?.companyName?.charAt(0) || 'ج'}</span>
                                        <span className="text-[8px] tracking-widest uppercase mt-1">
                                            {settings?.companyName || 'Jammaz'}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>{settings?.companyName || 'شركة الجماز'}</h1>
                            <p className="text-sm font-semibold opacity-80" style={{ color: primaryColor }}>للاستيراد والتصدير</p>
                            <p className="text-xs text-slate-500 mt-2">{settings?.address || 'القاهرة - العتبة - شارع العسيلي'}</p>
                            <div className="text-xs text-slate-500 mt-2 space-y-1">
                                {[settings?.phone, ...(settings?.additionalPhones || [])]
                                    .filter(Boolean)
                                    .map((phone, index) => (
                                        <div key={index} className="flex items-center gap-1">
                                            <span className="text-slate-400 w-4">ت:</span>
                                            <span className="font-bold font-mono text-slate-600">{phone}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-left">
                            <div
                                className="text-white px-4 py-1 rounded-t-lg text-center text-sm font-bold"
                                style={{ backgroundColor: primaryColor }}
                            >
                                فاتورة مبيعات
                            </div>
                            <div className="border rounded-b-lg p-3 text-center bg-slate-50" style={{ borderColor: primaryColor }}>
                                <p className="font-mono text-xl font-bold" style={{ color: primaryColor }}>{invoice.number}</p>
                                <p className="text-xs text-slate-500 mt-1">{new Date(invoice.date).toLocaleDateString('ar-EG')}</p>
                            </div>
                        </div>
                        {settings?.showQRCode && (
                            <div className="bg-white p-2 border rounded-lg shadow-sm" style={{ borderColor: '#eee' }}>
                                <QRCode
                                    value={invoice.number}
                                    size={80}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                        )}
                    </div>
                </div >

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-sm bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-inner">
                    <div className="space-y-3">
                        <h3 className="font-bold mb-3 flex items-center gap-2 border-b pb-1" style={{ color: primaryColor }}>
                            بيانات العميل
                        </h3>
                        <div className="space-y-2 text-slate-700">
                            <p className="flex justify-between items-center"><span className="text-slate-400">الاسم:</span> <span className="font-bold text-lg">{invoice.customerName}</span></p>
                            {invoice.customerPhone && <p className="flex justify-between items-center"><span className="text-slate-400">الهاتف:</span> <span className="font-mono">{invoice.customerPhone}</span></p>}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-bold mb-3 text-left border-b pb-1" style={{ color: primaryColor }}>تفاصيل الفاتورة</h3>
                        <div className="space-y-2 text-slate-700">
                            <p className="flex justify-between items-center"><span className="text-slate-400">الحالة:</span> <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">مدفوع بالكامل</span></p>
                            <p className="flex justify-between items-center">
                                <span className="text-slate-400">طريقة الدفع:</span>
                                <span className="font-bold">
                                    {invoice.paymentType === 'cash' ? 'نقدي' : invoice.paymentType === 'bank' ? 'تحويل بنكي' : 'آجل'}
                                </span>
                            </p>
                            <p className="flex justify-between items-center"><span className="text-slate-400">بواسطة:</span> <span className="font-semibold">{invoice.createdBy?.name || 'المدير'}</span></p>
                        </div>
                    </div>
                </div >

                {/* Items Table */}
                < div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm mb-8" >
                    <table className="w-full border-collapse">
                        <thead className="text-white text-sm" style={{ backgroundColor: headerBgColor }}>
                            <tr>
                                <th className="py-4 px-4 text-right">المنتج</th>
                                <th className="py-4 px-4 text-center">الكمية</th>
                                <th className="py-4 px-4 text-center">سعر الوحدة</th>
                                <th className="py-4 px-4 text-center">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700">
                            {invoice.items.map((item, i) => (
                                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-4 font-bold" style={{ color: primaryColor }}>{item.productName || item.name || 'منتج'}</td>
                                    <td className="py-4 px-4 text-center font-semibold">{item.qty}</td>
                                    <td className="py-4 px-4 text-center font-mono">{item.unitPrice.toLocaleString()} ج.م</td>
                                    <td className="py-4 px-4 text-center font-black text-slate-900">{(item.qty * item.unitPrice).toLocaleString()} ج.م</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div >

                {/* Returns History */}
                {
                    returns && returns.length > 0 && (
                        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                <ArrowRightLeft className="text-amber-600" size={18} />
                                <h3 className="font-bold text-amber-900 uppercase tracking-tight">سجل المرتجعات لهذه الفاتورة</h3>
                            </div>
                            <div className="space-y-3">
                                {returns.map((ret, idx) => (
                                    <div key={idx} className="bg-white border-2 border-dashed border-amber-200 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-400 transition-colors">
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-amber-600 text-white rounded-md font-mono text-xs font-bold">{ret.returnNumber}</span>
                                                    <span className="text-slate-400 text-xs">{new Date(ret.date).toLocaleString('ar-EG')}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {ret.items.map((it, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-sm">
                                                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                                                            <span className="font-bold text-slate-700">{it.productId?.name || it.productName || 'منتج'}</span>
                                                            <span className="text-slate-400 italic">× {it.qty} وحدة</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-left flex flex-col justify-center">
                                                <span className="text-xs font-bold text-slate-400 uppercase">المبلغ المرتجع</span>
                                                <span className="text-2xl font-black text-amber-600">-{ret.totalRefund?.toLocaleString()} <span className="text-sm">ج.م</span></span>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">بواسطة: {ret.createdBy?.name || 'النظام'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Totals */}
                <div className="flex justify-between items-end gap-8">
                    <div className="flex-1 opacity-60">
                        {invoice.notes && (
                            <div className="text-xs p-4 bg-slate-50 rounded-xl border border-dotted border-slate-200">
                                <p className="font-bold text-slate-400 mb-1">ملاحظات:</p>
                                <p className="text-slate-600 italic">"{invoice.notes}"</p>
                            </div>
                        )}
                    </div>
                    <div className="w-80 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 shadow-lg">
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between text-slate-600 items-baseline">
                                <span>المجموع الفرعي:</span>
                                <span className="font-bold">{invoice.subtotal.toLocaleString()} ج.م</span>
                            </div>
                            <div className="flex justify-between text-slate-500 items-baseline">
                                <span>الضريبة (٪):</span>
                                <span className="font-semibold">{invoice.tax?.toLocaleString() || '0'} ج.م</span>
                            </div>
                            <div
                                className="pt-4 flex justify-between text-2xl font-black border-t-2"
                                style={{ color: primaryColor, borderTopColor: primaryColor }}
                            >
                                <span>الإجمالي:</span>
                                <span>{invoice.total.toLocaleString()} <span className="text-xs font-bold">ج.م</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                    <p className="font-black text-xl mb-3" style={{ color: primaryColor }}>
                        {settings?.footerText || 'شكراً لتعاملكم مع شركة الجماز'}
                    </p>
                    <p className="text-xs text-slate-400 mb-1">{settings?.address || 'القاهرة، مصر - العطبة'}</p>
                    <p className="text-[10px] text-slate-300">تم إصدار هذه الفاتورة إلكترونياً وهي معتمدة وصالحة دون توقيع</p>
                </div>
            </div >

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { visibility: hidden; background: white; width: 100%; }
                    #invoice-area {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 40px;
                        border: none;
                        box-shadow: none;
                        border-radius: 0;
                    }
                    #invoice-area * { visibility: visible; }
                    header, aside, .print\\:hidden, nav, .sonner { display: none !important; }
                }
            `}</style>
        </div>
    );
}

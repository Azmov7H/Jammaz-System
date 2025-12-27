'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowRight, Trash2, ArrowRightLeft, Loader2, Wallet } from 'lucide-react';
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, setRes] = await Promise.all([
                    fetch(`/api/invoices/${id}`),
                    fetch(`/api/settings/invoice-design`)
                ]);

                const invData = await invRes.json();
                const setData = await setRes.json();

                setInvoice(invData.invoice);
                setSettings(setData);
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
                .map(([productId, qty]) => ({ productId, qty }));

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
                        <DialogContent className="max-w-3xl glass-card border-none shadow-2xl" dir="rtl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <ArrowRightLeft className="text-amber-600" size={20} />
                                    </div>
                                    استرجاع منتجات من الفاتورة #{invoice.number}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="max-h-[400px] overflow-y-auto px-1">
                                    {/* Desktop Table - Hidden on Mobile */}
                                    <div className="hidden md:block border rounded-xl overflow-hidden shadow-sm bg-white">
                                        <Table className={"p-4"}>
                                            <TableHeader className="bg-slate-200">
                                                <TableRow>
                                                    <TableHead className="text-right">المنتج</TableHead>
                                                    <TableHead className="text-center">المباع</TableHead>
                                                    <TableHead className="text-center">السعر</TableHead>
                                                    <TableHead className="text-center w-32">كمية الارتجاع</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {invoice.items.map((item, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-bold">{item.name || 'منتج'}</TableCell>
                                                        <TableCell className="text-center font-bold text-slate-500">{item.qty}</TableCell>
                                                        <TableCell className="text-center font-mono">{item.unitPrice.toLocaleString()} ج.م</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-full"
                                                                    onClick={() => {
                                                                        const current = returnItems[item.productId?._id || item.productId] || 0;
                                                                        if (current > 0) {
                                                                            setReturnItems(prev => ({ ...prev, [item.productId?._id || item.productId]: current - 1 }));
                                                                        }
                                                                    }}
                                                                >-</Button>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max={item.qty}
                                                                    className="h-8 text-center font-bold p-0"
                                                                    value={returnItems[item.productId?._id || item.productId] || 0}
                                                                    onChange={(e) => {
                                                                        const val = Math.min(item.qty, Math.max(0, parseInt(e.target.value) || 0));
                                                                        setReturnItems(prev => ({ ...prev, [item.productId?._id || item.productId]: val }));
                                                                    }}
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-full"
                                                                    onClick={() => {
                                                                        const current = returnItems[item.productId?._id || item.productId] || 0;
                                                                        if (current < item.qty) {
                                                                            setReturnItems(prev => ({ ...prev, [item.productId?._id || item.productId]: current + 1 }));
                                                                        }
                                                                    }}
                                                                >+</Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Mobile Cards - Shown on Mobile Only */}
                                    <div className="md:hidden space-y-3">
                                        {invoice.items.map((item, i) => (
                                            <div key={i} className="bg-white border p-3 rounded-xl shadow-sm space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-sm">{item.name || 'منتج'}</div>
                                                        <div className="text-xs text-slate-500">سعر الوحدة: {item.unitPrice.toLocaleString()} ج.م</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-slate-400">الكمية بالمباع: {item.qty}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                                    <span className="text-xs font-bold">كمية الارتجاع:</span>
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="secondary"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg shadow-sm"
                                                            onClick={() => {
                                                                const current = returnItems[item.productId?._id || item.productId] || 0;
                                                                if (current > 0) {
                                                                    setReturnItems(prev => ({ ...prev, [item.productId?._id || item.productId]: current - 1 }));
                                                                }
                                                            }}
                                                        >-</Button>
                                                        <span className="w-8 text-center font-black text-lg">
                                                            {returnItems[item.productId?._id || item.productId] || 0}
                                                        </span>
                                                        <Button
                                                            variant="secondary"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg shadow-sm"
                                                            onClick={() => {
                                                                const current = returnItems[item.productId?._id || item.productId] || 0;
                                                                if (current < item.qty) {
                                                                    setReturnItems(prev => ({ ...prev, [item.productId?._id || item.productId]: current + 1 }));
                                                                }
                                                            }}
                                                        >+</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:order-2">
                                        <Card className="p-5 border-slate-200 bg-slate-900 text-white shadow-xl flex flex-col justify-center items-center text-center h-full">
                                            <span className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">إجمالي المبلغ المسترد</span>
                                            <div className="text-4xl font-black text-amber-400">
                                                {
                                                    invoice.items.reduce((sum, item) => {
                                                        const qty = returnItems[item.productId?._id || item.productId] || 0;
                                                        return sum + (qty * item.unitPrice);
                                                    }, 0).toLocaleString()
                                                } <span className="text-lg font-bold">ج.م</span>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="md:order-1">
                                        <Card className="p-5 border-amber-100 bg-amber-50/20 shadow-sm relative overflow-hidden group h-full">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                                            <Label className="font-bold text-amber-900 block mb-3 flex items-center gap-2">
                                                <Wallet size={16} /> طريقة رد المبلغ
                                            </Label>
                                            <Select value={refundMethod} onValueChange={setRefundMethod}>
                                                <SelectTrigger className="bg-white border-amber-200 h-11 shadow-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent dir="rtl">
                                                    <SelectItem value="cash">💵 استرداد نقدي (خزينة)</SelectItem>
                                                    <SelectItem value="customerBalance">💳 رصيد عميل (محفظة)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <div className="mt-3 p-2 bg-white/50 rounded-lg border border-amber-100/50">
                                                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                                                    {refundMethod === 'cash'
                                                        ? 'سيتم خصم المبلغ من الخزينة وتسليمه للعميل نقداً. سيتم تسجيل العملية كمصروفات مرتجع.'
                                                        : 'سيتم تسوية ديون العميل أولاً بالمبلغ، ثم إضافة المتبقي كمبلغ متاح في محفظته للمشتريات القادمة.'}
                                                </p>
                                            </div>
                                        </Card>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleReturnSubmit}
                                    className="w-full h-14 text-xl font-black gradient-primary shadow-colored border-0 hover-lift"
                                    disabled={isReturning}
                                >
                                    {isReturning ? <Loader2 className="animate-spin" /> : 'إصدار فاتورة مرتجع معتمدة'}
                                </Button>
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
                            <p className="text-xs text-slate-400">ت: {settings?.phone || '01000000000'}</p>
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
                </div>

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
                </div>

                {/* Items Table */}
                <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm mb-8">
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
                                    <td className="py-4 px-4 font-bold" style={{ color: primaryColor }}>{item.name || 'منتج'}</td>
                                    <td className="py-4 px-4 text-center font-semibold">{item.qty}</td>
                                    <td className="py-4 px-4 text-center font-mono">{item.unitPrice.toLocaleString()} ج.م</td>
                                    <td className="py-4 px-4 text-center font-black text-slate-900">{(item.qty * item.unitPrice).toLocaleString()} ج.م</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
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
            </div>

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

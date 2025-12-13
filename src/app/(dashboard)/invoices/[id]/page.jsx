'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import QRCode from "react-qr-code";

export default function InvoiceViewPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/invoices/${id}`)
            .then(res => res.json())
            .then(data => {
                setInvoice(data.invoice);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [id]);

    const handlePrint = () => {
        window.print();
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

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Action Bar (Hidden in Print) */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <Button variant="outline" onClick={() => router.back()} className="gap-2">
                    <ArrowRight size={16} /> العودة
                </Button>
                <Button onClick={handlePrint} className="gap-2 bg-primary">
                    <Printer size={16} /> طباعة / PDF
                </Button>
                <Button variant="destructive" onClick={handleDelete} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                    <Trash2 size={16} /> حذف
                </Button>
            </div>

            {/* Invoice Container */}
            <div className="bg-white border text-slate-800 p-10 rounded-xl shadow-lg print:shadow-none print:border-none print:p-0" id="invoice-area">

                {/* Header with Logo */}
                <div className="flex justify-between items-start border-b-2 border-[#D4AF37] pb-6 mb-6"> {/* Gold Border */}
                    <div className="flex items-center gap-4">
                        {/* Jammaz Logo Placeholder or SVG */}
                        <div className="w-20 h-20 bg-[#1B3C73] text-[#D4AF37] flex flex-col items-center justify-center rounded-xl shadow-lg border-2 border-[#D4AF37]">
                            <span className="text-3xl font-bold">ج</span>
                            <span className="text-[8px] tracking-widest uppercase mt-1">Jammaz</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[#1B3C73]">شركة الجماز</h1>
                            <p className="text-sm font-semibold text-[#D4AF37]">للاستيراد والتصدير - العتبة</p>
                            <p className="text-xs text-slate-500 mt-2">القاهرة - العتبة - شارع العسيلي - ممر الجماز</p>
                            <p className="text-xs text-slate-400">ت: 01000000000</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-left">
                            <div className="bg-[#1B3C73] text-white px-4 py-1 rounded-t-lg text-center text-sm font-bold">فاتورة ضريبية</div>
                            <div className="border border-[#1B3C73] rounded-b-lg p-3 text-center bg-slate-50">
                                <p className="font-mono text-xl font-bold text-[#1B3C73]">{invoice.number}</p>
                                <p className="text-xs text-slate-500 mt-1">{new Date(invoice.date).toLocaleDateString('ar-EG')}</p>
                            </div>
                        </div>
                        {/* QR Code */}
                        <div className="bg-white p-2 border rounded-lg">
                            <QRCode
                                value={typeof window !== 'undefined' ? window.location.href : ''}
                                size={80}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-sm bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div>
                        <h3 className="font-bold text-[#1B3C73] mb-3 flex items-center gap-2">
                            بيانات العميل
                        </h3>
                        <div className="space-y-2 text-slate-700">
                            <p className="flex justify-between border-b border-white pb-1"><span className="text-slate-400">الاسم:</span> <span className="font-bold">{invoice.customerName}</span></p>
                            {/* Add Phone if available */}
                            {invoice.customerPhone && <p className="flex justify-between border-b border-white pb-1"><span className="text-slate-400">الهاتف:</span> <span>{invoice.customerPhone}</span></p>}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-[#1B3C73] mb-3 text-left">تفاصيل الفاتورة</h3>
                        <div className="space-y-2 text-slate-700">
                            <p className="flex justify-between border-b border-white pb-1"><span className="text-slate-400">الحالة:</span> <span className="text-green-600 font-bold">مدفوعة</span></p>
                            <p className="flex justify-between border-b border-white pb-1"><span className="text-slate-400">بواسطة:</span> <span>{invoice.createdBy?.name || 'النظام'}</span></p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8 border-collapse">
                    <thead className="bg-[#1B3C73] text-white text-sm">
                        <tr>
                            <th className="py-3 px-4 text-right first:rounded-r-lg">المنتج</th>
                            <th className="py-3 px-4 text-center">الكمية</th>
                            <th className="py-3 px-4 text-center">سعر الوحدة</th>
                            <th className="py-3 px-4 text-center last:rounded-l-lg">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-700">
                        {invoice.items.map((item, i) => (
                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-yellow-50/30 transition-colors">
                                <td className="py-3 px-4 font-medium text-[#1B3C73]">{item.name || 'منتج'}</td>
                                <td className="py-3 px-4 text-center">{item.qty}</td>
                                <td className="py-3 px-4 text-center">{item.unitPrice} ج.م</td>
                                <td className="py-3 px-4 text-center font-bold text-slate-900">{(item.qty * item.unitPrice).toLocaleString()} ج.م</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-72 bg-[#F8FAFC] p-4 rounded-xl border border-slate-200">
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>المجموع الفرعي:</span>
                                <span>{invoice.subtotal.toLocaleString()} ج.م</span>
                            </div>
                            {invoice.discount > 0 && (
                                <div className="flex justify-between text-red-600 bg-red-50 px-2 rounded">
                                    <span>الخصم:</span>
                                    <span>- {invoice.discount} ج.م</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-600">
                                <span>الضريبة (14%):</span> {/* Egypt Tax */}
                                <span>{invoice.tax?.toLocaleString() || '0'} ج.م</span>
                            </div>
                            <div className="border-t-2 border-[#D4AF37] pt-3 flex justify-between text-xl font-bold text-[#1B3C73]">
                                <span>الإجمالي النهائي:</span>
                                <span>{invoice.total.toLocaleString()} ج.م</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                    <p className="font-bold text-[#1B3C73] mb-2">شكراً لثقتكم في شركة الجماز</p>
                    <p>العنوان: القاهرة، مصر -  العتبه - شارع العسيلي - ممر الجماز</p>
                    <p className="mt-1">تم إصدار هذه الفاتورة إلكترونياً وهي معتمدة</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { visibility: hidden; background: white; }
                    #invoice-area {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                        border: none;
                        box-shadow: none;
                    }
                    #invoice-area * { visibility: visible; }
                    /* Hide everything else explicitly to be safe */
                    header, aside, .print\\:hidden, nav { display: none !important; }
                }
            `}</style>
        </div>
    );
}

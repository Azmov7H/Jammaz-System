'use client';

import { usePurchaseOrder } from '@/hooks/usePurchaseOrders';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ArrowRight } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useRef } from 'react';

export default function PurchaseOrderInvoice() {
    const { id } = useParams();
    const router = useRouter();
    const { data: po, isLoading, error } = usePurchaseOrder(id);

    // If loading
    if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-[#1B3C73]" /></div>;
    if (error) return <div className="p-10 text-center text-red-500">حدث خطأ أثناء تحميل الطلب.</div>;
    if (!po) return null;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0 print:bg-white">
            {/* Action Bar (Hidden in Print) */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <ArrowRight size={18} /> عودة
                </Button>
                <Button onClick={() => window.print()} className="bg-[#1B3C73] gap-2">
                    <Printer size={18} /> طباعة الفاتورة
                </Button>
            </div>

            {/* Invoice Container */}
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:w-full">

                {/* Header */}
                <div className="flex justify-between items-start border-b pb-8 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1B3C73] mb-2">أمر شراء</h1>
                        <p className="text-slate-500 font-mono">PO #{po.poNumber}</p>
                        <div className="mt-4 space-y-1 text-sm text-slate-600">
                            <p><strong>التاريخ:</strong> {new Date(po.createdAt).toLocaleDateString('ar-EG')}</p>
                            <p><strong>الحالة:</strong> {po.status === 'RECEIVED' ? 'تم الاستلام' : 'معلق'}</p>
                            <p><strong>حرر بواسطة:</strong> {po.createdBy?.name || 'النظام'}</p>
                        </div>
                    </div>
                    <div className="text-left">
                        {/* Logo Placeholder */}
                        <div className="mb-4">
                            <div className="text-2xl font-black text-[#1B3C73]">شركة الجماز</div>
                            <div className="text-sm text-slate-400 font-bold tracking-widest">للاستيراد والتصدير</div>
                        </div>
                        <div className="text-sm text-slate-500 space-y-1">
                            <p>القاهرة - العتبة</p>
                            <p>شارع العسيلي - ممر الجماز</p>
                            <p>هاتف: 01000000000</p>
                        </div>
                    </div>
                </div>

                {/* Supplier Info */}
                <div className="bg-slate-50 p-4 rounded-lg mb-8 print:bg-white print:border print:border-slate-200">
                    <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">بيانات المورد</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-lg font-bold text-slate-800">{po.supplier?.name}</p>
                        </div>
                        <div className="text-left text-sm text-slate-600">
                            <p>{po.supplier?.phone}</p>
                            <p>{po.supplier?.address || 'العنوان غير مسجل'}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-[#1B3C73]">
                            <th className="py-3 text-right font-bold text-[#1B3C73]">المنتج</th>
                            <th className="py-3 text-center font-bold text-[#1B3C73]">الكمية</th>
                            <th className="py-3 text-center font-bold text-[#1B3C73]">سعر الوحدة</th>
                            <th className="py-3 text-left font-bold text-[#1B3C73]">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {po.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-4">
                                    <div className="font-bold">{item.productId?.name || item.productName}</div>
                                    <div className="text-xs text-slate-500 font-mono">{item.productId?.code}</div>
                                </td>
                                <td className="py-4 text-center">{item.quantity}</td>
                                <td className="py-4 text-center">{item.costPrice.toLocaleString()} ج.م</td>
                                <td className="py-4 text-left font-bold">{(item.quantity * item.costPrice).toLocaleString()} ج.م</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 bg-slate-50 p-4 rounded-lg space-y-2 border print:bg-white print:border-slate-800">
                        <div className="flex justify-between text-lg font-bold text-[#1B3C73]">
                            <span>الإجمالي الكلي:</span>
                            <span>{po.totalCost.toLocaleString()} ج.م</span>
                        </div>
                    </div>
                </div>

                {/* Footer / Signatures */}
                <div className="grid grid-cols-2 gap-8 mt-12 print:mt-20">
                    <div className="text-center">
                        <div className="h-20 border-b border-slate-300 mb-2"></div>
                        <p className="text-sm font-bold text-slate-500">توقيع المسؤول</p>
                    </div>
                    <div className="text-center">
                        <div className="h-20 border-b border-slate-300 mb-2"></div>
                        <p className="text-sm font-bold text-slate-500">ختم المورد</p>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="hidden print:block text-center text-xs text-slate-400 mt-12">
                    تم إصدار هذا المستند إلكترونياً
                </div>

            </div>
        </div>
    );
}

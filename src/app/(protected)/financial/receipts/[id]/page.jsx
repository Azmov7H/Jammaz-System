'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Printer, ArrowRight, Download, CheckCircle2, Phone, MapPin, Globe, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/utils';
import Image from 'next/image';

export default function ReceiptPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: receiptData, isLoading, error } = useQuery({
        queryKey: ['receipt', id],
        queryFn: async () => {
            const res = await fetch(`/api/financial/receipts/${id}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to fetch receipt');
            return json.data;
        }
    });

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-bold italic">جاري تجهيز السند المالي...</p>
            </div>
        );
    }

    if (error || !receiptData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                    <ArrowRight className="h-10 w-10 rotate-45" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black">خطأ في تحميل السند</h2>
                    <p className="text-muted-foreground">{error?.message || 'السند المطلوب غير موجود'}</p>
                </div>
                <Button onClick={() => router.back()} className="rounded-xl px-8 font-bold">العودة للخلف</Button>
            </div>
        );
    }

    const { transaction, partner, settings, remainingBalance } = receiptData;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20" dir="rtl">
            {/* Print Hider Style */}
            <style jsx global>{`
                @media print {
                    nav, aside, header, .print-hidden, .header-actions {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .receipt-card {
                        box-shadow: none !important;
                        border: 1px solid #e2e8f0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                    }
                    .container {
                        max-width: 100% !important;
                        padding: 0 !important;
                    }
                }
            `}</style>

            {/* Header Actions - Hidden on Print */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden header-actions">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="rounded-2xl gap-2 font-bold hover:bg-white/5"
                >
                    <ArrowRight className="h-4 w-4" /> العودة
                </Button>

                <div className="flex items-center gap-3">
                    <Button onClick={handlePrint} className="rounded-2xl gap-2 font-black h-12 px-8 gradient-primary shadow-colored border-0 hover:scale-105 transition-all">
                        <Printer className="h-4 w-4" /> طباعة السند
                    </Button>
                </div>
            </div>

            {/* Receipt Body */}
            <Card className="border-0 shadow-2xl relative overflow-hidden bg-white text-slate-900 print:shadow-none print:border print:border-slate-200 receipt-card">
                {/* Visual Decorative Bar */}
                <div className="absolute top-0 right-0 left-0 h-2 bg-primary print:hidden" />

                <CardContent className="p-8 sm:p-12 space-y-12">
                    {/* Brand & Identity */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8 border-b border-slate-100 pb-10">
                        <div className="space-y-4">
                            {settings.showLogo && settings.companyLogo ? (
                                <Image src={settings.companyLogo} alt="Logo" width={120} height={60} className="object-contain" />
                            ) : (
                                <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg ring-4 ring-primary/10">
                                    {(settings.companyName || 'N').charAt(0)}
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl font-black tracking-tight">{settings.companyName}</h1>
                                <p className="text-slate-500 font-bold mt-1">سند تحصيل مالي إلكتروني</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-right">
                            <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">رقم السند</span>
                                <span className="text-xl font-black font-mono text-primary">{transaction.receiptNumber || `TR- ${transaction._id.toString().slice(-6).toUpperCase()}`}</span>
                            </div>
                            <div className="flex flex-col gap-1 pr-6">
                                <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-500">
                                    <span>التاريخ:</span>
                                    <span className="font-mono text-slate-900">{format(new Date(transaction.date), 'dd MMMM yyyy', { locale: ar })}</span>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-500">
                                    <span>الوقت:</span>
                                    <span className="font-mono text-slate-900">{format(new Date(transaction.date), 'HH:mm', { locale: ar })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Payer Info */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <div className="h-1 w-8 bg-slate-200" /> يُصرف لـ / السيد
                            </h3>
                            <div className="space-y-4 pr-4">
                                <div className="text-2xl font-black text-slate-900">{partner?.name || 'عميل نقدي'}</div>
                                <div className="space-y-2">
                                    {partner?.phone && (
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                            <Phone className="h-4 w-4 text-primary/60" /> {partner.phone}
                                        </div>
                                    )}
                                    {partner?.address && (
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                            <MapPin className="h-4 w-4 text-primary/60" /> {partner.address}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Amount Box */}
                        <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-[160px]">
                            {/* Watermark Logo */}
                            <CheckCircle2 className="absolute -right-8 -bottom-8 h-48 w-48 opacity-10" />

                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 relative z-10">المبلغ المُستلم</span>
                            <div className="flex items-baseline gap-2 relative z-10">
                                <span className="text-5xl font-black tracking-tighter font-mono">{transaction.amount.toLocaleString()}</span>
                                <span className="text-lg font-bold text-slate-400 italic">ج.م</span>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10 relative z-10 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-slate-300">طريقة الدفع: {
                                    transaction.description.includes('بنك') ? 'تحويل بنكي' :
                                        transaction.description.includes('شيك') ? 'شيك بنكي' : 'نقداً'
                                }</span>
                            </div>
                        </div>
                    </div>

                    {/* Description & Balance */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">وذلك عـن / البيان</span>
                                <p className="text-xl font-bold leading-relaxed pr-2 border-r-4 border-primary/20">{transaction.description}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 mt-6 border-t border-slate-200/50">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">مرجع العملية</span>
                                    <span className="font-bold text-slate-700">
                                        {transaction.referenceType === 'Invoice' ? 'فاتورة مبيعات' :
                                            transaction.referenceType === 'Debt' ? 'مديونية سابقة' : 'تحصيل يدوي'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">مُحرر السند</span>
                                    <span className="font-bold text-slate-700">{transaction.createdBy?.name || 'النظام'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Balance Info */}
                        <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 flex flex-col justify-center items-center text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block mb-2">المبلغ المتبقي بعد العملية</span>
                            <div className="text-3xl font-black text-rose-600 font-mono">
                                {(remainingBalance ?? 0).toLocaleString()}
                                <span className="text-xs font-bold mr-1 italic">ج.م</span>
                            </div>
                            <p className="text-[10px] text-rose-400 font-bold mt-2">يرجى الالتزام بمواعيد السداد المحددة</p>
                        </div>
                    </div>

                    {/* Footer / Signature Area */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-12 pt-12 border-t border-slate-100 relative">
                        {/* Company Seal */}
                        <div className="absolute left-[50%] top-[-50px] -translate-x-[50%] opacity-20 hidden print:block pointer-events-none">
                            <div className="w-40 h-40 rounded-full border-8 border-primary flex flex-col items-center justify-center p-4 text-center">
                                <span className="text-[10px] font-black uppercase text-primary leading-none mb-1">مدفوع / PAID</span>
                                <div className="h-px bg-primary w-full my-2" />
                                <span className="text-xs font-black text-primary leading-tight">{settings.companyName}</span>
                                <div className="h-px bg-primary w-full my-2" />
                                <span className="text-[10px] font-black text-primary">{format(new Date(), 'yyyy/MM/dd')}</span>
                            </div>
                        </div>

                        <div className="space-y-4 max-w-sm">
                            <h4 className="text-sm font-black text-slate-900">معلومات الاتصال</h4>
                            <div className="grid grid-cols-1 gap-2 text-xs font-bold text-slate-500">
                                {settings.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {settings.phone}</div>}
                                {settings.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {settings.email}</div>}
                                {settings.address && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {settings.address}</div>}
                            </div>
                        </div>

                        {/* Visual Seal Container */}
                        <div className="w-48 h-48 rounded-full border-[6px] border-slate-200/50 flex flex-col items-center justify-center p-6 text-center rotate-6 scale-90 sm:scale-100">
                            <div className="text-primary font-black text-lg leading-tight mb-2">{settings.companyName}</div>
                            <div className="h-[2px] w-12 bg-slate-200 my-1" />
                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Certified Receipt</div>
                            <div className="text-[8px] font-black text-slate-300 mt-1 italic">محرر إلكترونياً</div>
                        </div>

                        <div className="text-center space-y-8 min-w-[200px]">
                            <div className="h-20 flex items-center justify-center opacity-30 italic font-medium pt-8">
                                <span className="border-b-2 border-dotted border-slate-300 px-12">التوقيع والختم</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-300 italic max-w-[200px]">هذا السند مُحرر إلكترونياً ولا يتطلب ختم يدوي في حالة وجود رمز التحقق</p>
                        </div>
                    </div>
                </CardContent>

                {/* Print Helper Bar */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100 hidden print:block">
                    <p className="text-[10px] font-bold text-slate-400">{settings.companyName} - نظام إدارة المبيعات المطور ®</p>
                </div>
            </Card>

            {/* Support Message */}
            <div className="bg-primary/5 rounded-3xl p-6 text-center border border-primary/10 print:hidden">
                <p className="text-sm font-bold text-primary flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> شكراً لتعاملكم مع {settings.companyName}
                </p>
            </div>
        </div>
    );
}

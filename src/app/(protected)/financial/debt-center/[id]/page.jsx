'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Calendar,
    ArrowLeft,
    Building2,
    User,
    CheckCircle2,
    Briefcase,
    Receipt,
    Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentDialog } from '@/components/financial/PaymentDialog';
import { useState } from 'react';

export default function DebtDetailPage({ params }) {
    const router = useRouter();
    const { id } = params;
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Fetch Debt Details
    const { data: debtData, isLoading } = useQuery({
        queryKey: ['debt', id],
        queryFn: async () => {
            const res = await fetch(`/api/financial/debts?_id=${id}`);
            if (!res.ok) throw new Error('Failed to fetch debt');
            const json = await res.json();
            return json.data.debts[0]; // Reuse list API heavily filtered
        }
    });

    // Fetch Payment History
    const { data: paymentsData } = useQuery({
        queryKey: ['payments', id],
        queryFn: async () => {
            const res = await fetch(`/api/financial/payments?debtId=${id}`);
            if (!res.ok) throw new Error('Failed to fetch payments');
            return res.json();
        },
        enabled: !!id
    });

    const debt = debtData;
    const payments = paymentsData?.data || [];

    if (isLoading) return <div className="p-12 text-center text-muted-foreground">جاري تحميل التفاصيل...</div>;
    if (!debt) return <div className="p-12 text-center text-rose-500">الدين غير موجود</div>;

    const progress = ((debt.originalAmount - debt.remainingAmount) / debt.originalAmount) * 100;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        {debt.referenceType === 'Invoice' ? 'فاتورة' : 'أمر شراء'}
                        <span className="font-mono text-muted-foreground">#{debt.referenceId?.toString().slice(-6)}</span>
                    </h1>
                </div>
                <div className="mr-auto flex gap-2">
                    <Button variant="outline" className="gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                        شطب الدين (Write-off)
                    </Button>
                    {debt.remainingAmount > 0 && (
                        <Button className="gap-2" onClick={() => setIsPaymentOpen(true)}>
                            تسجيل دفعة
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Info Card */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="text-lg">ملخص المديونية</span>
                                <Badge variant="outline" className="text-base px-4 py-1">
                                    {debt.status}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Amounts */}
                            <div className="grid grid-cols-2 gap-8 p-6 bg-black/20 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">المبلغ الأصلي</p>
                                    <p className="text-3xl font-black">{formatCurrency(debt.originalAmount)}</p>
                                </div>
                                <div className="text-left border-r border-white/10 pr-8">
                                    <p className="text-sm text-muted-foreground mb-1">المتبقي</p>
                                    <p className="text-3xl font-black text-rose-500">{formatCurrency(debt.remainingAmount)}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                                    <User className="text-muted-foreground w-4 h-4" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">العميل / المورد</p>
                                        <p className="font-bold">{debt.debtorId?.name || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                                    <Calendar className="text-muted-foreground w-4 h-4" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">تاريخ الاستحقاق</p>
                                        <p className="font-bold font-mono">{formatDate(debt.dueDate)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline / History */}
                    <Card className="border-white/5 bg-white/[0.02]">
                        <CardHeader>
                            <CardTitle>سجل العمليات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative space-y-8 pl-6 border-r-2 border-white/5 mr-4 border-r-0 border-l-2 ml-0 pr-6 border-l-gray-800">
                                {/* Creation Event */}
                                <div className="relative">
                                    <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-background" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">إنشاء المديونية</span>
                                        <span className="text-xs text-muted-foreground">{formatDate(debt.createdAt)}</span>
                                        <p className="text-sm mt-2 p-3 bg-white/5 rounded-lg border border-white/5">
                                            تم إنشاء مديونية بقيمة {formatCurrency(debt.originalAmount)} (تلقائي)
                                        </p>
                                    </div>
                                </div>

                                {/* Payments */}
                                {payments.map((payment) => (
                                    <div key={payment._id} className="relative">
                                        <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-background" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-emerald-500">سداد دفعة</span>
                                            <span className="text-xs text-muted-foreground">{formatDate(payment.date)}</span>
                                            <div className="mt-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold">{formatCurrency(payment.amount)}</p>
                                                    <p className="text-xs opacity-70">{payment.method} - {payment.notes || 'No notes'}</p>
                                                </div>
                                                <CheckCircle2 size={16} className="text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {debt.status === 'settled' && (
                                    <div className="relative">
                                        <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-white ring-4 ring-background animate-pulse" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white">إغلاق المديونية</span>
                                            <span className="text-xs text-muted-foreground">تم السداد بالكامل</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="border-white/5 bg-white/[0.02]">
                        <CardHeader>
                            <CardTitle className="text-base">معلومات الاتصال</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-lg">{debt.debtorId?.name}</p>
                                    <p className="text-sm text-muted-foreground">{debt.debtorId?.phone}</p>
                                </div>
                                <Separator className="my-2 bg-white/10" />
                                <Button variant="outline" className="w-full">
                                    عرض الملف الشخصي
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/5 bg-white/[0.02]">
                        <CardHeader>
                            <CardTitle className="text-base">إجراءات سريعة</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Button variant="ghost" className="justify-start gap-2">
                                <Receipt size={16} /> عرض الفاتورة
                            </Button>
                            <Button variant="ghost" className="justify-start gap-2">
                                <Wallet size={16} /> سجل المدفوعات
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <PaymentDialog
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                debt={debt}
            />
        </div>
    );
}

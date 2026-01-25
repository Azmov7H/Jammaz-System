'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Wallet, Users, FileText, Banknote, ArrowRightLeft,
    Phone, MapPin, Calendar, Clock, AlertTriangle, CheckCircle2,
    TrendingUp, TrendingDown, CreditCard, ChevronLeft, Truck, Globe, FileSignature
} from 'lucide-react';
import { DebtTable } from '@/components/financial/DebtTable';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/utils';

export function CustomerDetailsSheet({
    customer,
    open,
    onOpenChange,
    debts = [],
    invoices = [],
    onRecordPayment,
    onManageInstallment,
    onCollectInvoice
}) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');

    if (!customer) return null;

    // Stats Calculations
    const totalDebt = debts.reduce((sum, d) => sum + (d.remainingAmount || 0), 0);
    const activeDebtsCount = debts.filter(d => d.status !== 'settled' && d.status !== 'written-off').length;
    const pendingInvoices = invoices.filter(i => i.customer?._id === customer._id);
    const totalInvoices = pendingInvoices.reduce((sum, i) => sum + (i.total - i.paidAmount), 0);

    // Combined Balance (Debts + Invoices)
    const totalBalance = totalDebt + totalInvoices;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-full sm:max-w-2xl p-0 border-r border-white/10 bg-[#0f172a] text-foreground" dir="rtl">
                {/* Header Section */}
                <div className="bg-gradient-to-b from-white/5 to-transparent p-6 pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
                        <div className="relative">
                            <Avatar className="h-20 w-20 border-4 border-[#0f172a] shadow-2xl ring-2 ring-primary/20">
                                <AvatarFallback className="bg-gradient-to-tr from-primary to-blue-600 text-white text-2xl font-black">
                                    {customer.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[#0f172a]",
                                customer.isActive ? "bg-emerald-500" : "bg-rose-500"
                            )} />
                        </div>

                        <div className="flex-1 space-y-2">
                            <div>
                                <Link href={`/customers/${customer._id}`} className="hover:text-primary transition-colors">
                                    <SheetTitle className="text-3xl font-black tracking-tight cursor-pointer">{customer.name}</SheetTitle>
                                </Link>
                                <SheetDescription className="hidden">
                                    تفاصيل العميل {customer.name} - الفواتير والديون
                                </SheetDescription>
                                <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm mt-1">
                                    <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                        <Phone size={12} className="text-primary" />
                                        <span className="font-mono font-bold">{customer.phone}</span>
                                    </div>
                                    {customer.address && (
                                        <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                            <MapPin size={12} className="text-primary" />
                                            <span className="max-w-[150px] truncate">{customer.address}</span>
                                        </div>
                                    )}
                                    <Badge variant="outline" className={cn(
                                        "font-bold border-2",
                                        customer.priceType === 'wholesale' ? "text-blue-400 border-blue-400/20 bg-blue-400/10" :
                                            customer.priceType === 'special' ? "text-purple-400 border-purple-400/20 bg-purple-400/10" :
                                                "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
                                    )}>
                                        {customer.priceType === 'wholesale' ? 'جملة' : customer.priceType === 'special' ? 'خاص' : 'قطاعي'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="text-left bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-md min-w-[160px]">
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block mb-1">الرصيد الإجمالي</span>
                            <span className={cn(
                                "text-2xl font-black font-mono block",
                                totalBalance > 0 ? "text-rose-500" : "text-emerald-500"
                            )}>
                                {totalBalance.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground opacity-75">
                                {totalBalance > 0 ? 'مستحقات للتحصيل' : 'لا توجد مستحقات'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-4 border border-blue-500/10 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FileText size={48} />
                            </div>
                            <span className="text-xs text-blue-200 font-bold block mb-1 relative z-10">فواتير مفتوحة</span>
                            <div className="flex items-center justify-between relative z-10">
                                <span className="text-2xl font-black text-blue-100">{totalInvoices.toLocaleString()}</span>
                                <Badge className="bg-blue-500 text-white hover:bg-blue-600 border-0 font-bold">
                                    {pendingInvoices.length}
                                </Badge>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 rounded-2xl p-4 border border-rose-500/10 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingDown size={48} />
                            </div>
                            <span className="text-xs text-rose-200 font-bold block mb-1 relative z-10">ديون سابقة</span>
                            <div className="flex items-center justify-between relative z-10">
                                <span className="text-2xl font-black text-rose-100">{totalDebt.toLocaleString()}</span>
                                <Badge className="bg-rose-500 text-white hover:bg-rose-600 border-0 font-bold">
                                    {activeDebtsCount}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="px-6 -mt-6 relative z-10">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full h-14 bg-[#020617] border border-white/10 p-1.5 rounded-2xl mb-6 shadow-xl grid grid-cols-3 gap-2">
                            <TabsTrigger
                                value="overview"
                                className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-black text-muted-foreground h-full transition-all"
                            >
                                نظرة عامة
                            </TabsTrigger>
                            <TabsTrigger
                                value="invoices"
                                className="rounded-xl font-bold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-muted-foreground h-full transition-all"
                            >
                                الفواتير ({pendingInvoices.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="debts"
                                className="rounded-xl font-bold data-[state=active]:bg-rose-500 data-[state=active]:text-white text-muted-foreground h-full transition-all"
                            >
                                الديون ({activeDebtsCount})
                            </TabsTrigger>
                        </TabsList>

                        <ScrollArea className="h-[calc(100vh-380px)] pr-4 -mr-4 pl-4 -ml-4 pb-24">
                            <TabsContent value="overview" className="space-y-6 mt-0 px-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Personal Info Card */}
                                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5 space-y-4">
                                        <div className="flex items-center gap-3 text-muted-foreground mb-2">
                                            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                                                <Users size={16} />
                                            </div>
                                            <h3 className="font-black text-sm">بيانات العميل</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <InfoRow label="رقم الهاتف" value={customer.phone} icon={Phone} />
                                            <InfoRow label="العنوان" value={customer.address} icon={MapPin} />
                                            <InfoRow label="تاريخ الإضافة" value={new Date(customer.createdAt).toLocaleDateString('ar-EG')} icon={Calendar} />
                                        </div>
                                    </div>

                                    {/* Shipping & Business Info */}
                                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5 space-y-4">
                                        <div className="flex items-center gap-3 text-muted-foreground mb-2">
                                            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                                                <Truck size={16} />
                                            </div>
                                            <h3 className="font-black text-sm">بيانات الشحن والعمل</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <InfoRow label="شركة الشحن" value={customer.shippingCompany || 'غير محدد'} icon={Truck} active={!!customer.shippingCompany} />
                                            <InfoRow label="البلد / المنطقة" value={customer.address ? customer.address.split('،')[0] : 'غير محدد'} icon={Globe} />
                                            <InfoRow label="يوم التحصيل" value={customer.collectionDay && customer.collectionDay !== 'None' ? customer.collectionDay : 'غير محدد'} icon={Banknote} />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                {customer.notes && (
                                    <div className="bg-amber-500/5 rounded-3xl p-5 border border-amber-500/10">
                                        <div className="flex items-center gap-3 text-amber-500/80 mb-3">
                                            <FileSignature size={16} />
                                            <h3 className="font-black text-sm">ملاحظات</h3>
                                        </div>
                                        <p className="text-sm text-amber-200/80 leading-relaxed font-medium">
                                            {customer.notes}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="invoices" className="mt-0">
                                <div className="space-y-3">
                                    {pendingInvoices.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                                            <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
                                            <p className="font-black text-lg">لا توجد فواتير مستحقة</p>
                                            <p className="text-sm font-medium mt-1">سجل العميل المالي نظيف من الفواتير</p>
                                        </div>
                                    ) : (
                                        pendingInvoices.map(invoice => (
                                            <div key={invoice._id} className="bg-card rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition-all group shadow-sm hover:shadow-lg hover:shadow-blue-500/5 cursor-default relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="flex items-start justify-between mb-6 relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-lg flex items-center gap-2">
                                                                فاتورة #{invoice.number}
                                                                {new Date(invoice.dueDate) < new Date() && (
                                                                    <Badge variant="destructive" className="h-5 text-[10px] px-2 shadow-lg shadow-rose-900/20">متأخرة</Badge>
                                                                )}
                                                            </h4>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                                                                    <Calendar size={12} /> {new Date(invoice.dueDate).toLocaleDateString('ar-EG')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-end justify-between relative z-10 bg-black/20 p-4 rounded-xl border border-white/5">
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block mb-1">المبلغ المتبقي</span>
                                                        <span className="text-2xl font-black font-mono text-white block leading-none">
                                                            {(invoice.total - invoice.paidAmount).toLocaleString()}
                                                            <span className="text-xs font-bold text-muted-foreground mr-1 align-top">ج.م</span>
                                                        </span>
                                                    </div>
                                                    <Button
                                                        onClick={() => onCollectInvoice(invoice)}
                                                        className="h-10 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                                                    >
                                                        تحصيل الآن <Wallet className="w-4 h-4 mr-2" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="debts" className="mt-0">
                                <div className="bg-card rounded-3xl border border-white/5 overflow-hidden shadow-custom-xl">
                                    <div className="p-4 bg-muted/20 border-b border-white/5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-black text-sm flex items-center gap-2">
                                                <TrendingDown className="w-4 h-4 text-rose-500" />
                                                سجل الديون والمديونيات القديمة
                                            </h3>
                                            <Badge variant="outline" className="font-mono">{activeDebtsCount} سجلات</Badge>
                                        </div>
                                    </div>
                                    <DebtTable
                                        debts={debts}
                                        onRecordPayment={onRecordPayment}
                                        onScheduleInstallment={onManageInstallment}
                                        compact
                                    />
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </div>

                <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-[#0f172a] border-t border-white/10 flex-row gap-3 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-50">
                    <Button
                        variant="ghost"
                        className="flex-1 h-14 rounded-2xl font-bold text-muted-foreground hover:bg-white/5 hover:text-white border border-white/5 hover:border-white/10 transition-all"
                        onClick={() => router.push(`/receivables?customerId=${customer._id}`)}
                    >
                        سجل الحركات الكامل <ArrowRightLeft className="w-5 h-5 mr-2" />
                    </Button>
                    <Button
                        className="flex-[2] h-14 rounded-2xl font-black text-lg bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/10"
                        onClick={() => onOpenChange(false)}
                    >
                        إغلاق
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function InfoRow({ label, value, icon: Icon, active = false }) {
    if (!value) return null;
    return (
        <div className={cn(
            "flex items-center justify-between p-3 rounded-xl border transition-colors",
            active ? "bg-primary/10 border-primary/20" : "bg-black/20 border-white/5 hover:bg-white/5"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2 rounded-lg",
                    active ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
                )}>
                    <Icon size={14} />
                </div>
                <span className="text-xs font-bold text-muted-foreground">{label}</span>
            </div>
            <span className={cn(
                "font-bold text-sm",
                active ? "text-primary" : "text-foreground"
            )}>{value}</span>
        </div>
    );
}

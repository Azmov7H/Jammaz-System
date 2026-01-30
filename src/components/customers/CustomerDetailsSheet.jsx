'use client';

import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Wallet, ArrowRightLeft, Phone, MapPin, Calendar, Truck, FileSignature
} from 'lucide-react';
import { DebtTable } from '@/components/financial/DebtTable';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/utils';

export function CustomerDetailsSheet({
    customer,
    open,
    onOpenChange,
    onUnifiedCollection
}) {
    const router = useRouter();

    if (!customer) return null;

    // The authoritative balance is customer.balance which is updated by DebtService and PaymentService
    const totalBalance = customer.balance || 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-full sm:max-w-xl p-0 border-r border-white/10 bg-[#0f172a] text-foreground flex flex-col" dir="rtl">
                {/* Header Section */}
                <div className="bg-gradient-to-b from-white/5 to-transparent p-8 pb-10">
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-4 border-[#0f172a] shadow-2xl ring-2 ring-primary/20">
                                <AvatarFallback className="bg-gradient-to-tr from-primary to-blue-600 text-white text-3xl font-black">
                                    {customer.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-[#0f172a]",
                                customer.isActive ? "bg-emerald-500" : "bg-rose-500"
                            )} />
                        </div>

                        <div className="space-y-2">
                            <SheetTitle className="text-3xl font-black tracking-tight">{customer.name}</SheetTitle>
                            <SheetDescription className="text-muted-foreground font-bold">
                                {customer.isActive ? 'عميل نشط' : 'حساب متوقف'} • {customer.priceType === 'wholesale' ? 'جملة' : customer.priceType === 'special' ? 'خاص' : 'قطاعي'}
                            </SheetDescription>
                        </div>

                        {/* Total Balance Card */}
                        <div className="w-full bg-black/40 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-md shadow-2xl">
                            <span className="text-xs text-muted-foreground font-black uppercase tracking-widest block mb-2 opacity-50">إجمالي المتبقي للتحصيل</span>
                            <div className={cn(
                                "text-5xl font-black font-mono leading-none tracking-tighter mb-1",
                                totalBalance > 0 ? "text-rose-500" : "text-emerald-500"
                            )}>
                                {totalBalance.toLocaleString()}
                                <span className="text-sm font-bold ml-2 text-muted-foreground/50 italic">ج.م</span>
                            </div>

                            {totalBalance > 0 && (
                                <div className="mt-6">
                                    <Button
                                        onClick={() => onUnifiedCollection(customer, totalBalance)}
                                        className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] active:scale-95 group"
                                    >
                                        تحصيل المتبقي الآن
                                        <Wallet className="w-6 h-6 mr-3 text-primary group-hover:rotate-12 transition-transform" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <ScrollArea className="flex-1 px-8 pb-32">
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 gap-4">
                            <InfoRow label="رقم الهاتف" value={customer.phone} icon={Phone} active />
                            <InfoRow label="العنوان / المنطقة" value={customer.address || 'غير محدد'} icon={MapPin} />
                            <InfoRow label="شركة الشحن" value={customer.shippingCompany || 'غير محدد'} icon={Truck} />
                            <InfoRow label="يوم التحصيل" value={customer.collectionDay && customer.collectionDay !== 'None' ? customer.collectionDay : 'غير محدد'} icon={Calendar} />
                        </div>

                        {/* Notes */}
                        {customer.notes && (
                            <div className="bg-amber-500/5 rounded-3xl p-6 border border-amber-500/10">
                                <div className="flex items-center gap-3 text-amber-500/80 mb-3">
                                    <FileSignature size={18} />
                                    <h3 className="font-black text-sm">ملاحظات العميل</h3>
                                </div>
                                <p className="text-base text-amber-200/80 leading-relaxed font-bold">
                                    {customer.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-[#0f172a] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-50">
                    <div className="flex gap-4">
                        <Button
                            variant="ghost"
                            className="flex-1 h-14 rounded-2xl font-bold text-muted-foreground hover:bg-white/5 hover:text-white border border-white/5 transition-all text-sm"
                            onClick={() => router.push(`/receivables?customerId=${customer._id}`)}
                        >
                            سجل الحركات <ArrowRightLeft className="w-5 h-5 mr-3" />
                        </Button>
                        <Button
                            className="flex-1 h-14 rounded-2xl font-black text-lg bg-white/5 text-white hover:bg-white/10 border border-white/10 shadow-2xl"
                            onClick={() => onOpenChange(false)}
                        >
                            إغلاق
                        </Button>
                    </div>
                </div>
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

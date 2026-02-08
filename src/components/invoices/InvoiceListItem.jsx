'use client';

import { memo, useCallback } from 'react';
import { Calendar, User, Trash2, Receipt, Banknote, CreditCard, ArrowLeft, ArrowRightLeft, Landmark, Wallet, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const InvoiceListItem = memo(function InvoiceListItem({ invoice, onDelete }) {
    const router = useRouter();
    const paymentType = invoice.paymentType || 'cash';
    const isCash = paymentType === 'cash';

    const handleCardClick = useCallback((e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        router.push(`/invoices/${invoice._id}`);
    }, [router, invoice._id]);

    const getPaymentDisplay = () => {
        switch (paymentType) {
            case 'bank':
                return {
                    label: 'دفع بنكي',
                    icon: Landmark,
                    color: "bg-blue-500/5 text-blue-500 border-blue-500/20 shadow-blue-500/5",
                    accent: "bg-blue-500"
                };
            case 'wallet':
                return {
                    label: 'محفظة',
                    icon: Wallet,
                    color: "bg-purple-500/5 text-purple-500 border-purple-500/20 shadow-purple-500/5",
                    accent: "bg-purple-500"
                };
            case 'check':
                return {
                    label: 'شيك',
                    icon: Ticket,
                    color: "bg-indigo-500/5 text-indigo-500 border-indigo-500/20 shadow-indigo-500/5",
                    accent: "bg-indigo-500"
                };
            case 'credit':
                return {
                    label: 'دفع آجل',
                    icon: CreditCard,
                    color: "bg-amber-500/5 text-amber-500 border-amber-500/20 shadow-amber-500/5",
                    accent: "bg-amber-500"
                };
            case 'cash':
            default:
                return {
                    label: 'دفع نقدي',
                    icon: Banknote,
                    color: "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5",
                    accent: "bg-emerald-500"
                };
        }
    };

    const display = getPaymentDisplay();
    const PaymentIcon = display.icon;

    return (
        <div
            className="group cursor-pointer glass-card border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-[2rem] p-6 shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-500 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-8 border"
            onClick={handleCardClick}
        >
            {/* Ambient Accent Glow */}
            <div className={cn(
                "absolute -right-20 -top-20 w-40 h-40 rounded-full blur-[80px] opacity-10 transition-opacity group-hover:opacity-20",
                display.accent
            )} />

            {/* ID & Date Section */}
            <div className="flex items-center gap-6 min-w-[220px]">
                <div className={cn(
                    "h-16 w-16 rounded-2xl flex items-center justify-center font-black text-xl border transition-all duration-500 shadow-inner group-hover:rotate-6",
                    display.color.replace('bg-', 'bg-').replace('text-', 'text-').replace('border-', 'border-')
                )}>
                    <span className="opacity-40 text-xs ml-0.5">#</span>{invoice.number}
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-white/40">
                        <Calendar size={14} className="text-primary/60" />
                        <span className="text-[11px] font-black uppercase tracking-wider">
                            {format(new Date(invoice.date), 'eeee, d MMMM yyyy', { locale: ar })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn(
                            "px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest border transition-all",
                            display.color
                        )}>
                            <span className="flex items-center gap-2"><PaymentIcon size={12} /> {display.label}</span>
                        </Badge>
                        {invoice.hasReturns && (
                            <Badge variant="outline" className="px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest bg-rose-500/5 text-rose-500 border-rose-500/20 shadow-lg shadow-rose-500/5">
                                <ArrowRightLeft size={12} className="ml-2" />
                                مرتجع
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Customer & Creator Section */}
            <div className="flex-1 min-w-0 md:border-r border-white/5 md:pr-8">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 glass-card bg-white/5 rounded-2xl flex items-center justify-center text-white/20 border border-white/10 group-hover:text-primary group-hover:border-primary/50 transition-all duration-500">
                        <User size={24} />
                    </div>
                    <div className="flex flex-col truncate gap-1">
                        {invoice.customer ? (
                            <Link
                                href={`/customers/${invoice.customer?._id || invoice.customer}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-black text-xl text-foreground hover:text-primary transition-colors truncate tracking-tight"
                            >
                                {invoice.customerName || invoice.customer?.name || 'عميل نقدي سريع'}
                            </Link>
                        ) : (
                            <span className="font-black text-xl text-foreground truncate tracking-tight">
                                {invoice.customerName || 'عميل نقدي سريع'}
                            </span>
                        )}
                        <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">بواسطة: {invoice.createdBy?.name || 'النظام المركزي'}</span>
                    </div>
                </div>
            </div>

            {/* Financials & Actions */}
            <div className="flex items-center justify-between md:justify-end gap-10">
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-baseline gap-2 group/total">
                        <span className="text-3xl font-black tabular-nums tracking-tighter text-primary group-hover/total:scale-110 transition-transform duration-500">
                            {invoice.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">ج.م</span>
                    </div>
                    <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">إجمالي المعاملة</span>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟')) {
                                onDelete(invoice._id);
                            }
                        }}
                        className="h-12 w-12 rounded-2xl hover:bg-rose-500/10 text-white/10 hover:text-rose-500 transition-all duration-300 md:opacity-0 md:group-hover:opacity-100"
                    >
                        <Trash2 size={20} />
                    </Button>
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-45 transition-all duration-500 shadow-xl">
                        <ArrowLeft size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
});

InvoiceListItem.displayName = 'InvoiceListItem';


'use client';

import { Calendar, User, Trash2, Receipt, Wallet, Banknote, CreditCard, ArrowRight, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function InvoiceListItem({ invoice, onDelete }) {
    const paymentType = invoice.paymentType || 'cash';
    const isCash = paymentType === 'cash';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="group"
        >
            <Link href={`/invoices/${invoice._id}`}>
                <div className="bg-card border border-white/5 rounded-[2rem] p-6 shadow-custom-md hover:shadow-custom-xl hover:bg-white/[0.02] transition-all duration-500 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6">
                    {/* Visual Accent */}
                    <div className={cn(
                        "absolute right-0 top-0 bottom-0 w-1.5 transition-all duration-500 group-hover:w-3",
                        isCash ? "bg-emerald-500/40" : "bg-amber-500/40"
                    )} />

                    {/* Left Section: ID & Date */}
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "h-16 w-16 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                            isCash ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                            <Receipt className="w-8 h-8 opacity-20 absolute" />
                            <span className="relative">#{invoice.number}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {format(new Date(invoice.date), 'eeee, d MMMM yyyy', { locale: ar })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn(
                                    "px-3 py-0.5 rounded-full font-black text-[10px] uppercase tracking-widest border-2 transition-colors",
                                    isCash ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : "bg-amber-500/5 text-amber-500 border-amber-500/20"
                                )}>
                                    {isCash ? (
                                        <div className="flex items-center gap-1.5">
                                            <Banknote className="w-3 h-3" />
                                            <span>دفع نقدي</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <CreditCard className="w-3 h-3" />
                                            <span>دفع آجل</span>
                                        </div>
                                    )}
                                </Badge>
                                {invoice.hasReturns && (
                                    <Badge variant="outline" className="px-3 py-0.5 rounded-full font-black text-[10px] uppercase tracking-widest border-2 bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">
                                        <ArrowRightLeft className="w-3 h-3 ml-1" />
                                        <span>بها مرتجع</span>
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Customer */}
                    <div className="flex-1 min-w-0 pr-4 border-r border-white/5">
                        <div className="flex items-center gap-3 group/info">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover/info:bg-primary group-hover/info:text-white transition-all">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors truncate">
                                    {invoice.customerName || invoice.customer?.name || 'عميل نقدي'}
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1.5">
                                    بواسطة <span className="text-foreground/80">{invoice.createdBy?.name || 'النظام'}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Section: Financials & Action */}
                    <div className="flex items-center justify-between md:justify-end gap-8 md:pl-4">
                        <div className="text-left">
                            <div className="flex items-baseline gap-2 justify-end">
                                <span className="text-2xl md:text-3xl font-black text-primary tracking-tighter">
                                    {invoice.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">EGP</span>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-1">
                                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">إجمالي الفاتورة</span>
                                <div className="h-1 w-8 bg-primary/20 rounded-full" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onDelete(invoice._id);
                                }}
                                className="h-12 w-12 rounded-2xl hover:bg-rose-500/10 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </div>
                        </div>
                    </div>

                    {/* Background Decor */}
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
            </Link>
        </motion.div>
    );
}

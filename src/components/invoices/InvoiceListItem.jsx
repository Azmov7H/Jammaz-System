'use client';

import { Calendar, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            <Link href={`/invoices/${invoice._id}`}>
                <div className="glass-card p-5 rounded-[2rem] border border-white/5 hover:bg-white/5 hover:border-purple-500/20 transition-all group relative overflow-hidden">
                    {/* Colored indicator line */}
                    <div className={cn(
                        "absolute top-0 right-0 w-1 h-full transition-all group-hover:w-2",
                        isCash ? "bg-emerald-500" : "bg-amber-500"
                    )} />

                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 relative z-10">
                        {/* ID & Date */}
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className={cn(
                                "h-12 w-12 md:h-14 md:w-14 min-w-[48px] md:min-w-[56px] rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-base group-hover:scale-105 transition-transform shrink-0",
                                isCash ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                                <span className="truncate px-1">#{invoice.number}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                                    <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="text-xs md:text-sm font-semibold text-foreground/80 truncate">
                                        {format(new Date(invoice.date), 'dd MMM yyyy', { locale: ar })}
                                    </span>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[9px] md:text-[10px] h-5 font-bold",
                                        isCash
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                            : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                    )}
                                >
                                    {isCash ? '💵 نقدي' : '📋 آجل'}
                                </Badge>
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-purple-500/10 rounded-lg shrink-0">
                                    <User className="h-3 w-3 md:h-3.5 md:w-3.5 text-purple-500" />
                                </div>
                                <h3 className="font-bold text-base md:text-lg text-foreground group-hover:text-purple-500 transition-colors truncate">
                                    {invoice.customerName || invoice.customer?.name || 'عميل نقدي'}
                                </h3>
                            </div>
                            <div className="text-[10px] md:text-xs text-foreground/60 flex items-center gap-2 mr-6 md:mr-7 truncate">
                                <span className="truncate font-medium">بواسطة: {invoice.createdBy?.name || '-'}</span>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="text-left md:pl-6 md:border-l border-white/5 mt-2 md:mt-0">
                            <div className="text-xl md:text-2xl font-black text-purple-500 tracking-tight flex items-baseline gap-1 md:gap-1.5 justify-end">
                                {invoice.total.toFixed(2)}
                                <span className="text-xs md:text-sm text-foreground/60 font-bold">ج.م</span>
                            </div>
                            <div className="text-[10px] md:text-xs text-foreground/50 font-bold text-right mt-0.5 md:mt-1 uppercase tracking-wider">الإجمالي</div>
                        </div>
                    </div>

                    {/* Actions (Hidden by default, shown on hover) */}
                    <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-9 w-9 rounded-xl shadow-xl hover:shadow-2xl hover:scale-110 transition-all bg-red-500 hover:bg-red-600"
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(invoice._id);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/utils';
import {
    ArrowRightLeft, ArrowRight, Package, Banknote, Wallet, Loader2
} from 'lucide-react';

export function InvoiceReturnDialog({ invoice, open, onOpenChange, returnItems, setReturnItems, refundMethod, setRefundMethod, onSubmit, isReturning }) {
    return (
                    <Dialog open={open} onOpenChange={onOpenChange}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="gap-2 bg-warning/10 text-warning hover:bg-warning/10 border border-warning/30 shadow-sm hover-lift">
                                <ArrowRightLeft size={16} /> استرجاع منتجات
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl bg-foreground/1090 backdrop-blur-2xl border-white/5 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-0 gap-0 overflow-hidden rounded-[2.5rem]" dir="rtl">
                            <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-l from-warning via-warning to-warning opacity-80" />

                            <div className="p-8 pb-4">
                                <DialogHeader>
                                    <div className="flex items-center justify-between">
                                        <DialogTitle className="text-2xl font-bold flex items-center gap-4 text-white">
                                            <div className="p-3 bg-warning/10 rounded-2xl border border-warning/20 shadow-inner">
                                                <ArrowRightLeft className="text-warning" size={24} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span>استرجاع منتجات معتمدة</span>
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">الفاتورة #{invoice.number}</span>
                                            </div>
                                        </DialogTitle>
                                        <div className="text-left hidden md:block">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">تاريخ الفاتورة</span>
                                            <span className="text-xs font-bold text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                                {format(new Date(invoice.date), 'd MMMM yyyy', { locale: ar })}
                                            </span>
                                        </div>
                                    </div>
                                </DialogHeader>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col">
                                <ScrollArea className="flex-1 max-h-[320px] px-8 py-2">
                                    <div className="space-y-4 pb-8">
                                        {invoice.items.map((item, i) => {
                                            const itemId = item._id; // Use unique invoice item ID
                                            const currentReturnQty = returnItems[itemId] || 0;
                                            const isSelected = currentReturnQty > 0;

                                            return (
                                                <motion.div
                                                    key={i}
                                                    initial={false}
                                                    animate={{
                                                        scale: isSelected ? 1.01 : 1,
                                                        borderColor: isSelected ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                                                        backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.03)' : 'rgba(255, 255, 255, 0.02)'
                                                    }}
                                                    className={cn(
                                                        "group border rounded-3xl p-5 transition-all duration-300 relative overflow-hidden",
                                                    )}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className={cn(
                                                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                                isSelected ? "bg-warning text-white shadow-lg shadow-warning/20" : "bg-white/5 text-muted-foreground"
                                                            )}>
                                                                <Package size={20} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <h4 className="font-bold text-white text-lg group-hover:text-warning transition-colors uppercase tracking-tight">
                                                                    {item.productName || item.name || 'منتج'}
                                                                </h4>
                                                                <div className="flex items-center gap-3 text-xs font-bold mt-1">
                                                                    <span className="text-muted-foreground">سعر الوحدة:</span>
                                                                    <span className="text-muted-foreground">{item.unitPrice.toLocaleString()} ج.م</span>
                                                                    <div className="w-1 h-1 rounded-full bg-secondary" />
                                                                    <span className="text-muted-foreground">المباع:</span>
                                                                    <Badge variant="outline" className="h-5 px-2 bg-white/5 border-white/10 text-muted-foreground">{item.qty}</Badge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-center md:items-end gap-3">
                                                            <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label="إنقاص الكمية"
                                                                    className="h-10 w-10 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-all active:scale-95"
                                                                    onClick={() => {
                                                                        if (currentReturnQty > 0) {
                                                                            setReturnItems(prev => ({ ...prev, [itemId]: currentReturnQty - 1 }));
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="text-2xl font-bold leading-none">-</span>
                                                                </Button>

                                                                <div className="w-14 text-center">
                                                                    <span className={cn(
                                                                        "text-2xl font-bold tracking-tighter transition-all duration-300",
                                                                        isSelected ? "text-warning scale-110" : "text-muted-foreground"
                                                                    )}>
                                                                        {currentReturnQty}
                                                                    </span>
                                                                </div>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label="زيادة الكمية"
                                                                    className="h-10 w-10 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-all active:scale-95"
                                                                    onClick={() => {
                                                                        if (currentReturnQty < item.qty) {
                                                                            setReturnItems(prev => ({ ...prev, [itemId]: currentReturnQty + 1 }));
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="text-xl font-bold leading-none">+</span>
                                                                </Button>
                                                            </div>
                                                            {isSelected && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className="text-xs font-bold text-warning/60 uppercase tracking-widest"
                                                                >
                                                                    سيتم استرداد {(currentReturnQty * item.unitPrice).toLocaleString()} ج.م
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Background Accent for Selected */}
                                                    {isSelected && (
                                                        <motion.div
                                                            layoutId={`accent-${i}`}
                                                            className="absolute inset-0 bg-gradient-to-r from-warning/5 to-transparent pointer-events-none"
                                                        />
                                                    )}
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="p-8 pt-6 bg-foreground/1050 border-t border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-5 space-y-4">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mr-1">
                                                <Wallet size={12} className="text-warning" /> طريقة رد المبلغ
                                            </Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button type="button"
                                                    onClick={() => setRefundMethod('cash')}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group/btn",
                                                        refundMethod === 'cash'
                                                            ? "bg-warning/10 border-warning/50 text-warning"
                                                            : "bg-white/20 border-transparent text-muted-foreground hover:bg-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-xl transition-all",
                                                        refundMethod === 'cash' ? "bg-warning text-white" : "bg-white/5 group-hover/btn:bg-white/10"
                                                    )}>
                                                        <Banknote size={16} />
                                                    </div>
                                                    <span className="text-xs font-bold uppercase tracking-tighter">خزينة نقداً</span>
                                                </button>
                                                <button type="button"
                                                    onClick={() => setRefundMethod('customerBalance')}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group/btn",
                                                        refundMethod === 'customerBalance'
                                                            ? "bg-info/10 border-info/50 text-info"
                                                            : "bg-white/20 border-transparent text-muted-foreground hover:bg-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-xl transition-all",
                                                        refundMethod === 'customerBalance' ? "bg-info/10 text-white" : "bg-white/5 group-hover/btn:bg-white/10"
                                                    )}>
                                                        <Wallet size={16} />
                                                    </div>
                                                    <span className="text-xs font-bold uppercase tracking-tighter">محفظة العميل</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-7 flex flex-col justify-end">
                                        <div className="bg-foreground/1080 rounded-3xl p-6 border border-white/5 shadow-inner relative overflow-hidden group">
                                            <div className="flex justify-between items-center relative z-10">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">صافي القيمة المستردة</span>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-4xl font-bold text-warning tracking-tighter">
                                                            {
                                                                invoice.items.reduce((sum, item) => {
                                                                    const qty = returnItems[item.productId?._id || item.productId] || 0;
                                                                    return sum + (qty * item.unitPrice);
                                                                }, 0).toLocaleString()
                                                            }
                                                        </span>
                                                        <span className="text-sm font-bold text-muted-foreground">ج.م</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={onSubmit}
                                                    disabled={isReturning || Object.values(returnItems).every(q => q === 0)}
                                                    className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2 disabled:opacity-50 disabled:scale-100"
                                                >
                                                    {isReturning ? <Loader2 className="animate-spin" /> : (
                                                        <>
                                                            <span>اعتماد المرتجع</span>
                                                            <ArrowRight className="w-5 h-5 rotate-180" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
    );
}

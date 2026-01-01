'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tag, Layers, Box, History, Barcode } from 'lucide-react';

export function ProductViewDialog({ open, onOpenChange, product }) {
    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] glass-card border-white/10 p-0 rounded-[2.5rem]" dir="rtl">
                <div className="relative h-32 bg-primary/10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                    <div className="absolute -right-10 -top-10 h-40 w-40 bg-primary/20 blur-3xl rounded-full" />
                    <div className="absolute right-8 bottom-0 translate-y-1/2 p-4 bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl">
                        <Barcode className="h-12 w-12 text-primary" />
                    </div>
                </div>

                <div className="p-8 pt-12 space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black">{product.name}</h2>
                            <p className="font-mono text-muted-foreground mt-1 uppercase tracking-tighter">{product.code}</p>
                        </div>
                        <Badge className="h-10 px-6 rounded-2xl bg-primary/10 text-primary border-primary/20 font-black text-lg">
                            {product.retailPrice || product.sellPrice} ج.م
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'الماركة', val: product.brand, icon: Tag },
                            { label: 'الفئة', val: product.category, icon: Layers },
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase opacity-60 mb-1">
                                    <item.icon className="h-3 w-3" /> {item.label}
                                </div>
                                <p className="font-black text-sm">{item.val || '-'}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 space-y-4">
                            <h4 className="flex items-center gap-2 font-black text-emerald-500 text-xs uppercase tracking-widest">
                                <Box className="h-4 w-4" /> حالة المخزون الحالية
                            </h4>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-black">{product.stockQty}</p>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase">إجمالي الرصيد</p>
                                </div>
                                <div className="text-left font-bold text-xs space-y-1">
                                    <p className="opacity-60">المخزن: {product.warehouseQty || 0}</p>
                                    <p className="opacity-60">المحل: {product.shopQty || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
                            <h4 className="flex items-center gap-2 font-black text-primary text-xs uppercase tracking-widest">
                                <History className="h-4 w-4" /> الرصيد الافتتاحي
                            </h4>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-black">{(product.openingWarehouseQty || 0) + (product.openingShopQty || 0)}</p>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase">عند تسليم النظام</p>
                                </div>
                                <div className="text-left font-bold text-xs">
                                    <p className="opacity-60">التكلفة: {product.openingBuyPrice || product.buyPrice || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button className="flex-1 h-12 rounded-2xl font-black" onClick={() => onOpenChange(false)}>
                            إغلاق النافذة
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

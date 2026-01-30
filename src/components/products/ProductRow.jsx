'use client';

import * as React from 'react';
import {
    TableCell,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Barcode,
    Tag,
    Layers,
    MoreVertical,
    Eye,
    FileEdit,
    Trash2,
    XCircle,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from '@/utils';

export const ProductRow = React.memo(({
    product,
    canManage,
    onView,
    onEdit,
    onDelete
}) => {
    const stockStatus = product.stockQty === 0 ? 'out' :
        product.stockQty <= (product.minLevel || 5) ? 'low' : 'available';

    return (
        <TableRow className="group border-white/5 hover:bg-white/[0.04] transition-all duration-300 cursor-default h-24">
            <TableCell className="px-8">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:rotate-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 shadow-inner">
                        <Barcode className="h-7 w-7 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <p className="font-black text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                            {product.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                            <Badge variant="outline" className="font-black text-[10px] tracking-widest border-white/10 bg-white/5 px-2 py-0.5 rounded-md text-muted-foreground">
                                {product.code}
                            </Badge>
                            {product.unit && (
                                <span className="text-[11px] text-muted-foreground/40 font-black uppercase tracking-tighter">وحدة: {product.unit}</span>
                            )}
                        </div>
                    </div>
                </div>
            </TableCell>

            <TableCell className="px-8 hidden lg:table-cell">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-black text-foreground/80 group-hover:text-foreground transition-colors">
                        <Tag className="h-3.5 w-3.5 text-primary/60" />
                        {product.brand || 'عام'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                        <Layers className="h-3 w-3" />
                        {product.category || '-'}
                        {product.subsection && <span className="text-[8px] opacity-30 mx-1">/</span>}
                        {product.subsection}
                    </div>
                </div>
            </TableCell>

            <TableCell className="px-8 text-center">
                <div className="inline-flex flex-col items-center group/price">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black tabular-nums tracking-tighter text-primary">
                            {(product.retailPrice || product.sellPrice || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase opacity-40 group-hover/price:opacity-100 transition-opacity">ج.م</span>
                    </div>
                </div>
            </TableCell>

            <TableCell className="px-8 text-center hidden sm:table-cell">
                <div className="flex flex-col items-center gap-2">
                    <div className={cn(
                        "relative h-10 px-5 rounded-2xl border flex items-center justify-center font-black text-lg tabular-nums shadow-inner transition-all group-hover:scale-110",
                        stockStatus === 'out' ? "bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/5" :
                            stockStatus === 'low' ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5" :
                                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5"
                    )}>
                        {product.stockQty}
                    </div>
                    <div className="flex gap-3 text-[9px] font-black text-muted-foreground/30 group-hover:text-muted-foreground transition-colors uppercase tracking-widest">
                        <span>م: {product.warehouseQty || 0}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10 self-center" />
                        <span>ح: {product.shopQty || 0}</span>
                    </div>
                </div>
            </TableCell>

            <TableCell className="px-8 text-center hidden md:table-cell">
                {stockStatus === 'out' ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/5">
                        <XCircle size={12} className="animate-pulse" /> نفذت
                    </div>
                ) : stockStatus === 'low' ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/5">
                        <AlertTriangle size={12} /> منخفض
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/5">
                        <CheckCircle2 size={12} /> متوفر
                    </div>
                )}
            </TableCell>

            <TableCell className="px-8">
                <div className="flex items-center justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 transition-all group-hover:text-primary">
                                <MoreVertical size={20} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl glass-card border-white/10 shadow-2xl backdrop-blur-2xl">
                            <DropdownMenuItem onClick={() => onView(product)} className="gap-3 p-3 rounded-xl cursor-pointer transition-colors focus:bg-primary/20 focus:text-primary group/item font-black text-sm">
                                <Eye size={18} className="text-primary opacity-60 group-hover/item:opacity-100" />
                                <span>عرض المنتج</span>
                            </DropdownMenuItem>
                            {canManage && (
                                <>
                                    <DropdownMenuItem onClick={() => onEdit(product)} className="gap-3 p-3 rounded-xl cursor-pointer transition-colors focus:bg-amber-500/20 focus:text-amber-500 group/item font-black text-sm">
                                        <FileEdit size={18} className="text-amber-500 opacity-60 group-hover/item:opacity-100" />
                                        <span>تعديل الصنف</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/5 my-1" />
                                    <DropdownMenuItem
                                        onClick={() => onDelete(product._id)}
                                        className="gap-3 p-3 rounded-xl cursor-pointer transition-colors focus:bg-red-500/20 text-red-500/60 focus:text-red-500 group/item font-black text-sm"
                                    >
                                        <Trash2 size={18} />
                                        <span>حذف نهائي</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>
        </TableRow>
    );
});

ProductRow.displayName = 'ProductRow';

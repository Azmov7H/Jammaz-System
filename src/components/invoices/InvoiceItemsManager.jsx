'use client';

import { useState } from 'react';
import { Search, Package, ShoppingCart, Trash2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function InvoiceItemsManager({ items, setItems, onReportShortage }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleProductSearch = async (term) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`/api/products?search=${term}`);
            const json = await res.json();
            const data = json.data;
            const foundProducts = data?.products || [];
            setSearchResults(foundProducts);

            if (foundProducts.length === 1) {
                const p = foundProducts[0];
                if (p.code === term || p.name === term) {
                    addItem(p);
                    setSearchTerm('');
                    setSearchResults([]);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const addItem = (product) => {
        const stockToCheck = product.shopQty !== undefined ? product.shopQty : product.stockQty;

        if (stockToCheck <= 0) {
            onReportShortage(product);
            return;
        }

        const existing = items.find(i => i.productId === product._id);
        if (existing) {
            toast.warning('المنتج مضاف بالفعل');
            return;
        }

        setItems([...items, {
            productId: product._id,
            name: product.name,
            code: product.code,
            unitPrice: product.retailPrice || product.sellPrice || 0,
            qty: 1,
            maxQty: stockToCheck,
            retailPrice: product.retailPrice || product.sellPrice,
            wholesalePrice: product.wholesalePrice,
            specialPrice: product.specialPrice,
            buyPrice: product.buyPrice || 0,
            minProfitMargin: product.minProfitMargin || 0
        }]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const updateQty = (index, qty) => {
        const item = items[index];
        if (Number(qty) > item.maxQty) {
            toast.error(`الكمية المتوفرة فقط ${item.maxQty}`);
            return;
        }
        const newItems = [...items];
        newItems[index].qty = Number(qty);
        setItems(newItems);
    };

    const updatePrice = (index, newPrice) => {
        const item = items[index];
        const price = Number(newPrice);

        if (price <= 0) {
            toast.error('السعر يجب أن يكون أكبر من صفر');
            return;
        }

        if (price < item.buyPrice) {
            toast.warning('🔴 تحذير: السعر أقل من سعر الشراء!');
        }
        else if (item.minProfitMargin > 0) {
            const profitMargin = ((price - item.buyPrice) / item.buyPrice) * 100;
            if (profitMargin < item.minProfitMargin) {
                toast.warning(`🟠 تحذير: هامش الربح (${profitMargin.toFixed(1)}%) أقل من الحد الأدنى`);
            }
        }

        const newItems = [...items];
        newItems[index].unitPrice = price;
        setItems(newItems);
    };

    const removeItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    return (
        <div className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-6">
            <div className="relative">
                <Label className="font-bold mb-2 block">بحث عن منتج</Label>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
                    <Input
                        placeholder="اسم المنتج او الباركود..."
                        value={searchTerm}
                        onChange={e => handleProductSearch(e.target.value)}
                        className="h-12 pr-11 rounded-xl bg-white/5 border-white/5 focus:bg-white/10 text-base"
                        autoFocus
                    />
                </div>
                {searchResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 right-0 glass-card border border-white/10 rounded-xl shadow-2xl z-50 mt-2 max-h-72 overflow-y-auto"
                    >
                        {searchResults.map(p => {
                            const qty = p.shopQty !== undefined ? p.shopQty : p.stockQty;
                            return (
                                <div
                                    key={p._id}
                                    onClick={() => addItem(p)}
                                    className="p-4 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                            <Package className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{p.name}</div>
                                            <div className="text-xs text-muted-foreground">{p.code}</div>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-purple-500">{p.sellPrice || p.retailPrice} ج.م</div>
                                        <div className={`text-xs font-medium ${qty > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            متوفر: {qty}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            <div className="border border-white/5 rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-white/5">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-right font-bold">المنتج</TableHead>
                            <TableHead className="text-center w-24 font-bold">الكمية</TableHead>
                            <TableHead className="text-center font-bold">السعر</TableHead>
                            <TableHead className="text-center font-bold">الإجمالي</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">لا توجد منتجات مضافة</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {items.map((item, idx) => {
                                    const profitMargin = item.buyPrice > 0 ? ((item.unitPrice - item.buyPrice) / item.buyPrice) * 100 : 0;
                                    const isLoss = item.unitPrice < item.buyPrice;
                                    const isLowMargin = item.minProfitMargin > 0 && profitMargin < item.minProfitMargin;

                                    return (
                                        <motion.tr
                                            key={`${item.productId}-${idx}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <TableCell>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-muted-foreground">{item.code}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={item.maxQty}
                                                    value={item.qty}
                                                    onChange={e => updateQty(idx, e.target.value)}
                                                    className="h-9 text-center bg-white/5 border-white/5 rounded-lg"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unitPrice}
                                                        onChange={e => updatePrice(idx, e.target.value)}
                                                        className={cn(
                                                            "h-9 text-center rounded-lg bg-white/5 border-white/5",
                                                            isLoss && "border-red-500 bg-red-500/10",
                                                            isLowMargin && "border-amber-400 bg-amber-400/10"
                                                        )}
                                                    />
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        isLoss ? "text-red-500" : isLowMargin ? "text-amber-500" : "text-emerald-500"
                                                    )}>
                                                        {isLoss ? '🔴 خسارة' : `+${profitMargin.toFixed(1)}%`}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-purple-500">
                                                {(item.qty * item.unitPrice).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-red-500 hover:bg-red-500/10 rounded-lg h-8 w-8"
                                                    onClick={() => removeItem(idx)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

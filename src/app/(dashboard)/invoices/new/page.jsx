'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Printer, UserPlus, Search, AlertTriangle, Loader2, Receipt, User, DollarSign, ShoppingCart, X, CheckCircle2, Package, TrendingUp, Wallet, CreditCard, Banknote, Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function NewInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Data State
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Invoice State
    const [items, setItems] = useState([]);

    // Customer Smart Search State
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerSuggestions, setCustomerSuggestions] = useState([]);

    // Final Form Values
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerId, setCustomerId] = useState(null);
    const [customerCredit, setCustomerCredit] = useState(0);
    const [customerCreditLimit, setCustomerCreditLimit] = useState(0);
    const [customerBalance, setCustomerBalance] = useState(0);

    // Shortage Reporting State
    const [shortageDialog, setShortageDialog] = useState({ open: false, product: null });
    const [reportNote, setReportNote] = useState('');

    const [currentPriceType, setCurrentPriceType] = useState('retail');

    // Debounced Customer Search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (customerQuery.length < 2) {
                setCustomerSuggestions([]);
                return;
            }

            if (customerId && (customerQuery === customerName || customerQuery === customerPhone)) return;

            try {
                const res = await fetch(`/api/customers?search=${customerQuery}`);
                const data = await res.json();
                setCustomerSuggestions(Array.isArray(data) ? data : (data.customers || []));
            } catch (error) {
                console.error(error);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [customerQuery, customerId, customerName, customerPhone]);

    const handleProductSearch = async (term) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`/api/products?search=${term}`);
            const data = await res.json();
            const foundProducts = data.products || [];
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

    const handleCustomerInput = (e) => {
        const val = e.target.value;
        setCustomerQuery(val);
        if (val === '') {
            setCustomerId(null);
            setCustomerName('');
            setCustomerPhone('');
            setCurrentPriceType('retail');
        }
    };

    const selectCustomer = (customer) => {
        setCustomerId(customer._id);
        setCustomerName(customer.name);
        setCustomerPhone(customer.phone);
        setCustomerQuery(customer.name);
        setCurrentPriceType(customer.priceType || 'retail');
        setCustomerCredit(customer.creditBalance || 0);
        setCustomerCreditLimit(customer.creditLimit || 0);
        setCustomerBalance(customer.balance || 0);
        setCustomerSuggestions([]);
        toast.success(`تم اختيار العميل: ${customer.name} (${customer.priceType === 'wholesale' ? 'سعر جملة' : customer.priceType === 'special' ? 'سعر خاص' : 'سعر قطاعي'})`);
    };

    const getProductPrice = (product, type) => {
        if (type === 'wholesale') return product.wholesalePrice || product.retailPrice || 0;
        if (type === 'special') return product.specialPrice || product.retailPrice || 0;
        return product.retailPrice || product.sellPrice || 0;
    };

    useEffect(() => {
        if (items.length > 0) {
            setItems(prevItems => prevItems.map(item => {
                if (item.retailPrice) {
                    return {
                        ...item,
                        unitPrice: getProductPrice(item, currentPriceType)
                    };
                }
                return item;
            }));

            if (items.some(i => i.retailPrice)) {
                toast.info('تم تحديث أسعار المنتجات بناءً على نوع العميل');
            }
        }
    }, [currentPriceType]);

    const addItem = (product) => {
        const stockToCheck = product.shopQty !== undefined ? product.shopQty : product.stockQty;

        if (stockToCheck <= 0) {
            setShortageDialog({ open: true, product });
            return;
        }

        const existing = items.find(i => i.productId === product._id);
        if (existing) {
            toast.warning('المنتج مضاف بالفعل');
            return;
        }

        const price = getProductPrice(product, currentPriceType);

        setItems([...items, {
            productId: product._id,
            name: product.name,
            code: product.code,
            unitPrice: price,
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

    const handleReportShortage = async () => {
        if (!shortageDialog.product) return;
        try {
            const res = await fetch('/api/reports/shortage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: shortageDialog.product._id,
                    productName: shortageDialog.product.name,
                    requestedQty: 1,
                    availableQty: shortageDialog.product.shopQty || shortageDialog.product.stockQty || 0,
                    notes: reportNote
                })
            });

            if (res.ok) {
                toast.success('تم إرسال بلاغ النقص للمالك');
                setShortageDialog({ open: false, product: null });
                setReportNote('');
            } else {
                toast.error('فشل الإبلاغ');
            }
        } catch (error) {
            toast.error('خطأ في النظام');
        }
    };

    const removeItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
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
            toast.error('🔴 تحذير: السعر أقل من سعر الشراء! سيؤدي إلى خسارة');
        }
        else if (item.minProfitMargin > 0) {
            const profitMargin = ((price - item.buyPrice) / item.buyPrice) * 100;
            if (profitMargin < item.minProfitMargin) {
                toast.warning(`🟠 تحذير: هامش الربح (${profitMargin.toFixed(1)}%) أقل من الحد الأدنى (${item.minProfitMargin}%)`);
            }
        }

        const newItems = [...items];
        newItems[index].unitPrice = price;
        setItems(newItems);
    };

    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const total = subtotal;

    // Payment State
    const [paymentType, setPaymentType] = useState('cash');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast.error('الفاتورة فارغة');
            return;
        }

        if (paymentType === 'credit' && !customerId) {
            toast.error('يجب اختيار عميل للفاتورة الآجلة');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    customerName: customerName || 'Walk-in',
                    customerPhone,
                    customerId,
                    paymentType,
                    dueDate
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('تم إنشاء الفاتورة بنجاح!');
                router.push(`/invoices/${data.invoice._id}`);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('حدث خطأ في النظام');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-6" dir="rtl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
            >
                <div className="p-3 bg-purple-500/10 rounded-2xl">
                    <Receipt className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight">فاتورة مبيعات جديدة</h1>
                    <p className="text-muted-foreground font-medium">إنشاء وإصدار فاتورة جديدة</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-1"
                >
                    <div className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex items-center gap-2 font-bold text-lg text-foreground mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <UserPlus className="w-5 h-5 text-blue-500" />
                            </div>
                            بيانات العميل
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold">رقم الجوال أو اسم العميل</Label>
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
                                <Input
                                    value={customerQuery}
                                    onChange={handleCustomerInput}
                                    placeholder="بحث برقم الهاتف أو الاسم..."
                                    className="h-12 pr-10 rounded-xl bg-white/5 border-white/5 focus:bg-white/10"
                                    autoComplete="off"
                                />

                                {customerSuggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-full left-0 right-0 glass-card border border-white/10 rounded-xl shadow-2xl z-50 mt-2 max-h-60 overflow-y-auto"
                                    >
                                        {customerSuggestions.map(c => (
                                            <div
                                                key={c._id}
                                                onClick={() => selectCustomer(c)}
                                                className="p-4 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                                        <User className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-sm block">{c.name}</span>
                                                        <span className="text-xs text-muted-foreground">{c.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {customerId && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3"
                            >
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">الاسم:</span>
                                    <span className="font-bold">{customerName}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">حد الائتمان:</span>
                                    <span className={customerCreditLimit === 0 ? "text-emerald-500 font-bold" : "font-bold"}>
                                        {customerCreditLimit === 0 ? 'مفتوح ∞' : `${customerCreditLimit.toLocaleString()} ج.م`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">المديونية:</span>
                                    <span className={customerBalance > 0 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>
                                        {customerBalance.toLocaleString()} ج.م
                                    </span>
                                </div>
                                {customerCredit > 0 && (
                                    <div className="flex justify-between items-center text-sm bg-emerald-500/10 px-3 py-2 rounded-lg">
                                        <span className="text-emerald-500 font-medium">رصيد متاح:</span>
                                        <span className="text-emerald-500 font-bold">
                                            {customerCredit.toLocaleString()} ج.م
                                        </span>
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-9 text-xs text-red-500 border-red-200 hover:bg-red-50 rounded-lg"
                                    onClick={() => {
                                        setCustomerId(null);
                                        setCustomerQuery('');
                                        setCustomerName('');
                                        setCustomerPhone('');
                                        setCustomerCredit(0);
                                        setCustomerCreditLimit(0);
                                        setCustomerBalance(0);
                                    }}
                                >
                                    تغيير العميل
                                </Button>
                            </motion.div>
                        )}

                        <div className={customerId ? 'opacity-50 pointer-events-none' : ''}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground">الاسم</Label>
                                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-10 bg-white/5 border-white/5 rounded-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground">الهاتف</Label>
                                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-10 bg-white/5 border-white/5 rounded-lg text-left placeholder:text-right" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Items Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2"
                >
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
                                                    <div className="font-bold text-purple-500">{p.sellPrice} ج.م</div>
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
                                                        key={idx}
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
                </motion.div>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-start-2 lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-6 rounded-[2rem] bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 space-y-4"
                    >
                        <div className="flex justify-between text-base">
                            <span className="text-muted-foreground font-medium">المجموع الفرعي:</span>
                            <span className="font-bold">{subtotal.toLocaleString()} ج.م</span>
                        </div>

                        {customerCredit > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex justify-between text-sm glass-card p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                            >
                                <span className="text-emerald-500 font-bold">خصم رصيد مرتجع سابق:</span>
                                <span className="text-emerald-500 font-bold">-{Math.min(subtotal, customerCredit).toLocaleString()} ج.م</span>
                            </motion.div>
                        )}

                        <div className="space-y-3">
                            <Label className="font-bold">نوع الفاتورة</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <Button
                                    variant={paymentType === 'cash' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('cash')}
                                    className={cn(
                                        "h-12 rounded-xl font-bold transition-all",
                                        paymentType === 'cash'
                                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <Banknote className="ml-2 h-4 w-4" />
                                    نقدي
                                </Button>
                                <Button
                                    variant={paymentType === 'bank' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('bank')}
                                    className={cn(
                                        "h-12 rounded-xl font-bold transition-all",
                                        paymentType === 'bank'
                                            ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <Wallet className="ml-2 h-4 w-4" />
                                    بنكي
                                </Button>
                                <Button
                                    variant={paymentType === 'credit' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('credit')}
                                    className={cn(
                                        "h-12 rounded-xl font-bold transition-all",
                                        paymentType === 'credit'
                                            ? "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/20"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <CreditCard className="ml-2 h-4 w-4" />
                                    آجل
                                </Button>
                            </div>
                        </div>

                        {paymentType === 'credit' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                            >
                                <Label className="font-bold">تاريخ الاستحقاق</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="h-12 pr-10 rounded-xl bg-white/5 border-white/5"
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div className="border-t border-white/10 my-4"></div>

                        <div className="flex justify-between items-center">
                            <span className="text-xl font-black">الإجمالي النهائي:</span>
                            <span className="text-3xl font-black text-purple-500">
                                {Math.max(0, subtotal - customerCredit).toLocaleString()}
                                <span className="text-base text-muted-foreground mr-2">ج.م</span>
                            </span>
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-14 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-lg shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]"
                            onClick={handleSubmit}
                            disabled={loading || items.length === 0}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin ml-2" /> جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Save className="ml-2" size={20} /> إصدار الفاتورة
                                </>
                            )}
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Shortage Reporting Dialog */}
            <Dialog open={shortageDialog.open} onOpenChange={(open) => { if (!open) setShortageDialog({ ...shortageDialog, open: false }); }}>
                <DialogContent className="sm:max-w-[425px] glass-card border-white/10 p-0 rounded-[2rem] overflow-hidden" dir="rtl">
                    <div className="bg-red-600 p-6 text-white text-center">
                        <DialogHeader>
                            <div className="mx-auto w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3 text-white backdrop-blur-md">
                                <AlertTriangle className="h-7 w-7" />
                            </div>
                            <DialogTitle className="text-xl font-black">تنبيه: الكمية غير متوفرة</DialogTitle>
                            <DialogDescription className="text-red-100 font-medium">
                                المنتج <strong>{shortageDialog.product?.name}</strong> غير متوفر حالياً في المحل.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-4 bg-[#0f172a]">
                        <p className="text-sm text-muted-foreground font-medium">هل تود إبلاغ المالك ومدير المخزن عن هذا النقص؟</p>
                        <div className="space-y-2">
                            <Label className="font-bold">ملاحظات إضافية (اختياري)</Label>
                            <Input
                                placeholder="مثال: العميل طلب كمية كبيرة..."
                                value={reportNote}
                                onChange={e => setReportNote(e.target.value)}
                                className="h-11 rounded-xl bg-white/5 border-white/5"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-0 bg-[#0f172a] gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShortageDialog({ ...shortageDialog, open: false })}
                            className="flex-1 h-11 rounded-xl bg-white/5 border-white/10"
                        >
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleReportShortage}
                            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                            إبلاغ عن نقص
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

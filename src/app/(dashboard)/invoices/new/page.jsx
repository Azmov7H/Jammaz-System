'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Printer, UserPlus, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
                const res = await fetch(`/api/customers?search=${customerQuery}`); // Fixed query param name to match API
                const data = await res.json();
                // API returns array directly now based on my previous implementation
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
            setSearchResults(data.products || []);
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
            setCurrentPriceType('retail'); // Reset to retail
        }
    };

    const selectCustomer = (customer) => {
        setCustomerId(customer._id);
        setCustomerName(customer.name);
        setCustomerPhone(customer.phone);
        setCustomerQuery(customer.name);
        setCurrentPriceType(customer.priceType || 'retail'); // Set user price type
        setCustomerCredit(customer.creditBalance || 0);
        setCustomerCreditLimit(customer.creditLimit || 0);
        setCustomerBalance(customer.balance || 0);
        setCustomerSuggestions([]);
        toast.success(`تم اختيار العميل: ${customer.name} (${customer.priceType === 'wholesale' ? 'سعر جملة' : customer.priceType === 'special' ? 'سعر خاص' : 'سعر قطاعي'})`);
    };

    // Helper to get price based on type
    const getProductPrice = (product, type) => {
        if (type === 'wholesale') return product.wholesalePrice || product.retailPrice || 0;
        if (type === 'special') return product.specialPrice || product.retailPrice || 0;
        return product.retailPrice || product.sellPrice || 0;
    };

    // Effect: Recalculate prices when Customer/PriceType changes
    useEffect(() => {
        if (items.length > 0) {
            setItems(prevItems => prevItems.map(item => {
                // We need the original product data to recalculate. 
                // Since we don't store full product object in items, we rely on what we have or need to fetch?
                // Actually, 'items' should ideally store the available prices or we just accept that we might not have them?
                // The search result 'product' had all prices. But 'items' state only kept 'unitPrice'.
                // To fix this properly, we should store the price tiers in the item state.

                // For now, if we don't have the full object, we can't switch perfectly without refetching.
                // BUT, let's assume 'item' has the fields if we passed them.
                // Let's modify 'addItem' to store all prices.

                // If the item has the price fields (which we will add in addItem), we can switch.
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
            // Store all tier prices for dynamic switching
            retailPrice: product.retailPrice || product.sellPrice,
            wholesalePrice: product.wholesalePrice,
            specialPrice: product.specialPrice,
            // Store cost and profit margin info for warnings
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

    // Update price with profit margin warnings
    const updatePrice = (index, newPrice) => {
        const item = items[index];
        const price = Number(newPrice);

        if (price <= 0) {
            toast.error('السعر يجب أن يكون أكبر من صفر');
            return;
        }

        // Check if selling below cost
        if (price < item.buyPrice) {
            toast.error('🔴 تحذير: السعر أقل من سعر الشراء! سيؤدي إلى خسارة');
        }
        // Check if below minimum profit margin
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Printer className="w-6 h-6" /> فاتورة مبيعات جديدة
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Section */}
                <Card className="md:col-span-1 shadow-sm">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-2 font-bold text-lg text-secondary-foreground mb-2">
                            <UserPlus className="w-5 h-5" /> بيانات العميل
                        </div>
                        <div>
                            <Label>رقم الجوال أو اسم العميل</Label>
                            <div className="relative">
                                <div className="flex gap-2">
                                    <Input
                                        value={customerQuery}
                                        onChange={handleCustomerInput}
                                        placeholder="بحث برقم الهاتف أو الاسم..."
                                        className="text-right"
                                        autoComplete="off"
                                    />
                                    {customerId && (
                                        <div className="flex flex-col gap-1 w-full bg-slate-50 p-2 rounded-lg border border-slate-200">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">الاسم:</span>
                                                <span className="font-bold">{customerName}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">حد الائتمان:</span>
                                                <span className={customerCreditLimit === 0 ? "text-green-600 font-bold" : "font-mono font-bold"}>
                                                    {customerCreditLimit === 0 ? 'مفتوح (غير محدود)' : `${customerCreditLimit.toLocaleString()} ج.م`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">المديونية الحالية:</span>
                                                <span className={customerBalance > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                                                    {customerBalance.toLocaleString()} ج.م
                                                </span>
                                            </div>
                                            {customerCredit > 0 && (
                                                <div className="flex justify-between items-center text-xs bg-green-50 px-1 rounded">
                                                    <span className="text-green-700">رصيد متاح (استرداد):</span>
                                                    <span className="text-green-700 font-bold">
                                                        {customerCredit.toLocaleString()} ج.م
                                                    </span>
                                                </div>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-2 h-7 text-[10px] text-red-500 border-red-200 hover:bg-red-50"
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
                                        </div>
                                    )}
                                </div>
                                {customerSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-xl z-50 mt-1 max-h-48 overflow-y-auto">
                                        {customerSuggestions.map(c => (
                                            <div key={c._id} onClick={() => selectCustomer(c)} className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b last:border-0">
                                                <span className="font-bold text-sm">{c.name}</span>
                                                <span className="text-xs text-slate-500 font-mono">{c.phone}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={customerId ? 'opacity-50 pointer-events-none' : ''}>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label className="text-xs text-slate-500">الاسم</Label><Input value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-slate-50" /></div>
                                <div><Label className="text-xs text-slate-500">الهاتف</Label><Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="bg-slate-50 text-left placeholder:text-right" /></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Section */}
                <Card className="md:col-span-2 shadow-sm">
                    <CardContent className="pt-6 space-y-6">
                        <div className="relative">
                            <Label>بحث عن منتج</Label>
                            <Input
                                placeholder="اسم المنتج او الباركود..."
                                value={searchTerm}
                                onChange={e => handleProductSearch(e.target.value)}
                                className="bg-muted/30"
                                autoFocus
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border rounded-b-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {searchResults.map(p => {
                                        const qty = p.shopQty !== undefined ? p.shopQty : p.stockQty;
                                        return (
                                            <div key={p._id} onClick={() => addItem(p)} className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b last:border-0">
                                                <div>
                                                    <div className="font-bold text-sm">{p.name}</div>
                                                    <div className="text-xs text-muted-foreground">{p.code}</div>
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-bold text-primary">{p.sellPrice} ج.م</div>
                                                    <div className={`text-xs ${qty > 0 ? 'text-green-600' : 'text-red-500'}`}>متوفر: {qty}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="text-right">المنتج</TableHead>
                                        <TableHead className="text-center w-24">الكمية</TableHead>
                                        <TableHead className="text-center">السعر</TableHead>
                                        <TableHead className="text-center">الإجمالي</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد منتجات مضافة</TableCell></TableRow> : items.map((item, idx) => {
                                        const profitMargin = item.buyPrice > 0 ? ((item.unitPrice - item.buyPrice) / item.buyPrice) * 100 : 0;
                                        const isLoss = item.unitPrice < item.buyPrice;
                                        const isLowMargin = item.minProfitMargin > 0 && profitMargin < item.minProfitMargin;

                                        return (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.code}</div>
                                                </TableCell>
                                                <TableCell><Input type="number" min="1" max={item.maxQty} value={item.qty} onChange={e => updateQty(idx, e.target.value)} className="h-8 text-center" /></TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unitPrice}
                                                            onChange={e => updatePrice(idx, e.target.value)}
                                                            className={`h-8 text-center ${isLoss ? 'border-red-500 bg-red-50' : isLowMargin ? 'border-orange-400 bg-orange-50' : ''}`}
                                                        />
                                                        <span className={`text-xs ${isLoss ? 'text-red-600 font-bold' : isLowMargin ? 'text-orange-600' : 'text-green-600'}`}>
                                                            {isLoss ? '🔴 خسارة' : `+${profitMargin.toFixed(1)}%`}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold">{(item.qty * item.unitPrice).toLocaleString()}</TableCell>
                                                <TableCell><Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => removeItem(idx)}><Trash2 size={16} /></Button></TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-start-3 space-y-4">
                    <Card className="bg-slate-50 border-slate-200">
                        <CardContent className="pt-6 space-y-3">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">المجموع الفرعي:</span><span className="font-bold">{subtotal.toLocaleString()} ج.م</span></div>

                            {customerCredit > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-bold bg-green-50 p-2 rounded-lg border border-green-200">
                                    <span>خصم رصيد مرتجع سابق:</span>
                                    <span>-{Math.min(subtotal, customerCredit).toLocaleString()} ج.م</span>
                                </div>
                            )}

                            <div className="pt-2 space-y-2">
                                <Label>نوع الفاتورة</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={paymentType === 'cash' ? 'default' : 'outline'}
                                        onClick={() => setPaymentType('cash')}
                                        className="flex-1"
                                        size="sm"
                                    >
                                        نقدي
                                    </Button>
                                    <Button
                                        variant={paymentType === 'bank' ? 'default' : 'outline'}
                                        onClick={() => setPaymentType('bank')}
                                        className="flex-1 gap-1"
                                        size="sm"
                                    >
                                        تحويل بنكي
                                    </Button>
                                    <Button
                                        variant={paymentType === 'credit' ? 'default' : 'outline'}
                                        onClick={() => setPaymentType('credit')}
                                        className="flex-1"
                                        size="sm"
                                    >
                                        آجل
                                    </Button>
                                </div>
                            </div>

                            {paymentType === 'credit' && (
                                <div className="pt-2">
                                    <Label>تاريخ الاستحقاق</Label>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="bg-slate-50"
                                    />
                                </div>
                            )}

                            <div className="border-t border-slate-300 my-2"></div>
                            <div className="flex justify-between text-xl font-bold text-primary">
                                <span>الإجمالي النهائي:</span>
                                <span>{Math.max(0, subtotal - customerCredit).toLocaleString()} ج.م</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Button size="lg" className="w-full text-lg gap-2" onClick={handleSubmit} disabled={loading || items.length === 0}>
                        {loading ? <><Loader2 className="animate-spin" /> جاري الحفظ...</> : <><Save size={20} /> إصدار الفاتورة</>}
                    </Button>
                </div>
            </div>

            {/* Shortage Reporting Dialog */}
            <Dialog open={shortageDialog.open} onOpenChange={(open) => { if (!open) setShortageDialog({ ...shortageDialog, open: false }); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle size={24} />
                            تنبيه: الكمية غير متوفرة
                        </DialogTitle>
                        <DialogDescription>
                            المنتج <strong>{shortageDialog.product?.name}</strong> غير متوفر حالياً في المحل.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-slate-600">هل تود إبلاغ المالك ومدير المخزن عن هذا النقص؟</p>
                        <div className="space-y-2">
                            <Label>ملاحظات إضافية (اختياري)</Label>
                            <Input
                                placeholder="مثال: العميل طلب كمية كبيرة..."
                                value={reportNote}
                                onChange={e => setReportNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShortageDialog({ ...shortageDialog, open: false })}>إلغاء</Button>
                        <Button onClick={handleReportShortage} className="bg-red-600 hover:bg-red-700 text-white">إبلاغ عن نقص</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { User, UserPlus, Search, X, Truck, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { toast } from 'sonner';

export function InvoiceCustomerSelect({
    selectedCustomer,
    onSelect,
    onClear,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    shippingCompany,
    setShippingCompany,
    disabled = false
}) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);

    // Initial sync
    useEffect(() => {
        if (selectedCustomer) {
            setQuery(selectedCustomer.name);
        } else if (customerName && !query) {
            // Keep query in sync if manually typed (partial)
            // setQuery(customerName); 
        }
    }, [selectedCustomer]);

    // Debounced Search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.length < 2) {
                setSuggestions([]);
                return;
            }

            // Don't search if we already selected this exact customer
            if (selectedCustomer && (query === selectedCustomer.name || query === selectedCustomer.phone)) return;

            setIsSearching(true);
            try {
                const res = await fetch(`/api/customers?search=${query}`);
                const json = await res.json();
                const data = json.data;
                setSuggestions(Array.isArray(data) ? data : (data?.customers || []));
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, selectedCustomer]);

    const handleInput = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (val === '') {
            onClear();
        }
    };

    const handleSelect = (customer) => {
        onSelect(customer);
        setQuery(customer.name);
        setSuggestions([]);
    };

    return (
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
                        value={query}
                        onChange={handleInput}
                        placeholder="بحث برقم الهاتف أو الاسم..."
                        className="h-12 pr-10 rounded-xl bg-white/5 border-white/5 focus:bg-white/10"
                        autoComplete="off"
                    />

                    {suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-full left-0 right-0 glass-card border border-white/10 rounded-xl shadow-2xl z-50 mt-2 max-h-60 overflow-y-auto"
                        >
                            {suggestions.map(c => (
                                <div
                                    key={c._id}
                                    onClick={() => handleSelect(c)}
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

            {selectedCustomer && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3"
                >
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">الاسم:</span>
                        <span className="font-bold">{selectedCustomer.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">حد الائتمان:</span>
                        <span className={!selectedCustomer.creditLimit ? "text-emerald-500 font-bold" : "font-bold"}>
                            {!selectedCustomer.creditLimit ? 'مفتوح ∞' : `${selectedCustomer.creditLimit.toLocaleString()} ج.م`}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">المديونية:</span>
                        <span className={selectedCustomer.balance > 0 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>
                            {(selectedCustomer.balance || 0).toLocaleString()} ج.م
                        </span>
                    </div>
                    {/* Credit logic if needed */}
                    {(selectedCustomer.creditBalance || 0) > 0 && (
                        <div className="flex justify-between items-center text-sm bg-emerald-500/10 px-3 py-2 rounded-lg">
                            <span className="text-emerald-500 font-medium">رصيد متاح:</span>
                            <span className="text-emerald-500 font-bold">
                                {selectedCustomer.creditBalance.toLocaleString()} ج.م
                            </span>
                        </div>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-9 text-xs text-red-500 border-red-200 hover:bg-red-50 rounded-lg"
                        onClick={() => {
                            setQuery('');
                            onClear();
                        }}
                    >
                        تغيير العميل
                    </Button>
                </motion.div>
            )}

            <div className={selectedCustomer ? 'opacity-50 pointer-events-none' : ''}>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground">الاسم</Label>
                        <Input
                            value={customerName}
                            onChange={e => {
                                setCustomerName(e.target.value);
                                if (!selectedCustomer) setQuery(e.target.value);
                            }}
                            className="h-10 bg-white/5 border-white/5 rounded-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground">الهاتف</Label>
                        <Input
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            className="h-10 bg-white/5 border-white/5 rounded-lg text-left placeholder:text-right"
                        />
                    </div>
                </div>
            </div>

            {/* Shipping Company Field */}
            <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                    <Truck className="w-3 h-3 text-primary" />
                    شركة الشحن (اختياري)
                </Label>
                <Input
                    value={shippingCompany}
                    onChange={e => setShippingCompany(e.target.value)}
                    placeholder="اسم شركة الشحن..."
                    className="h-10 bg-white/5 border-white/5 rounded-lg"
                    disabled={disabled}
                />
            </div>

            {/* View Customer Details Dialog */}
            {selectedCustomer && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 bg-primary/10 border-primary/20 hover:bg-primary/20 rounded-lg gap-2"
                        onClick={() => setShowDetailsDialog(true)}
                    >
                        <Eye className="w-4 h-4" />
                        عرض بيانات العميل الكاملة
                    </Button>

                    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    بيانات العميل التفصيلية
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">الاسم</Label>
                                        <p className="font-bold">{selectedCustomer.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">رقم الهاتف</Label>
                                        <p className="font-bold font-mono">{selectedCustomer.phone}</p>
                                    </div>
                                </div>

                                {selectedCustomer.address && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                                        <p className="font-bold">{selectedCustomer.address}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">نوع التسعير</Label>
                                        <p className="font-bold">
                                            {selectedCustomer.priceType === 'wholesale' ? 'جملة' :
                                                selectedCustomer.priceType === 'special' ? 'خاص' : 'قطاعي'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">حد الائتمان</Label>
                                        <p className="font-bold">
                                            {!selectedCustomer.creditLimit ? 'مفتوح ∞' : `${selectedCustomer.creditLimit.toLocaleString()} ج.م`}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">المديونية الحالية</Label>
                                        <p className={`font-bold ${selectedCustomer.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {(selectedCustomer.balance || 0).toLocaleString()} ج.م
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">الرصيد المتاح</Label>
                                        <p className="font-bold text-emerald-500">
                                            {(selectedCustomer.creditBalance || 0).toLocaleString()} ج.م
                                        </p>
                                    </div>
                                </div>

                                {selectedCustomer.collectionDay && selectedCustomer.collectionDay !== 'None' && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">يوم التحصيل المفضل</Label>
                                        <p className="font-bold">{selectedCustomer.collectionDay}</p>
                                    </div>
                                )}

                                {selectedCustomer.notes && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">ملاحظات</Label>
                                        <p className="text-sm p-3 bg-muted rounded-lg">{selectedCustomer.notes}</p>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
}

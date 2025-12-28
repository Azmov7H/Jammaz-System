'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, FileText, Loader2, Search, Filter, Calendar, User, ShoppingBag, Banknote, CreditCard, Receipt, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function InvoicesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, cash, credit

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => setDebouncedSearch(val), 500);
    };

    const { data: invoices = [], isLoading } = useInvoices(debouncedSearch);
    const deleteMutation = useDeleteInvoice();

    const handleDelete = (id, e) => {
        e.preventDefault(); // Prevent link navigation
        if (!confirm('هل أنت متأكد من حذف الفاتورة؟ سيتم استرجاع الكميات للمخزن.')) return;
        deleteMutation.mutate(id);
    };

    // Filter Logic
    const filteredInvoices = invoices.filter(inv => {
        if (filterType === 'all') return true;
        // Assuming paymentType exists, default to cash if not
        const type = inv.paymentType || 'cash';
        if (filterType === 'cash') return type === 'cash';
        if (filterType === 'credit') return type === 'credit' || type === 'bank';
        return true;
    });

    // Stats
    const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const invoicesCount = filteredInvoices.length;
    const cashInvoices = filteredInvoices.filter(inv => (inv.paymentType || 'cash') === 'cash');
    const creditInvoices = filteredInvoices.filter(inv => (inv.paymentType || 'cash') !== 'cash');
    const avgInvoiceValue = invoicesCount > 0 ? totalSales / invoicesCount : 0;

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-2xl">
                            <Receipt className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">فواتير المبيعات</h1>
                            <p className="text-muted-foreground font-medium">إدارة وتتبع جميع فواتير المبيعات</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-3 w-full lg:w-auto"
                >
                    <Link href="/invoices/new" className="w-full lg:w-auto">
                        <Button className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 transition-all hover:scale-105">
                            <Plus className="ml-2 h-5 w-5" />
                            فاتورة جديدة
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Sales Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-indigo-700 text-white relative overflow-hidden shadow-2xl shadow-purple-900/20"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <TrendingUp className="h-6 w-6 text-blue-700" />
                            </div>
                            <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-blue-700 backdrop-blur-md">إجمالي</Badge>
                        </div>
                        <p className="text-sm font-medium text-blue-700 opacity-80 mb-1">إجمالي المبيعات</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-black text-blue-700 tracking-tight">{totalSales.toLocaleString()}</h2>
                            <span className="text-base text-blue-700 font-bold opacity-80">ج.م</span>
                        </div>
                    </div>
                </motion.div>

                {/* Invoices Count */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-[2.5rem] border border-blue-500/20 bg-blue-500/5 group hover:bg-blue-500/10 transition-all"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                            <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">عدد الفواتير</Badge>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-muted-foreground uppercase opacity-60 mb-1">إجمالي الفواتير</p>
                        <h3 className="text-3xl font-black text-blue-500 flex items-center gap-2">
                            {invoicesCount} <span className="text-base text-muted-foreground">فاتورة</span>
                        </h3>
                    </div>
                </motion.div>

                {/* Cash vs Credit */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5 group hover:bg-emerald-500/10 transition-all"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                            <Banknote className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase opacity-60">نقدي</span>
                            <span className="text-lg font-black text-emerald-500">{cashInvoices.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase opacity-60">آجل</span>
                            <span className="text-lg font-black text-amber-500">{creditInvoices.length}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Average Invoice */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6 rounded-[2.5rem] border border-amber-500/20 bg-amber-500/5 group hover:bg-amber-500/10 transition-all"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
                            <Wallet className="h-6 w-6 text-amber-500" />
                        </div>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">متوسط</Badge>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-muted-foreground uppercase opacity-60 mb-1">متوسط الفاتورة</p>
                        <h3 className="text-3xl font-black text-amber-500 flex items-center gap-2">
                            {avgInvoiceValue.toFixed(0)} <span className="text-base text-muted-foreground">ج.م</span>
                        </h3>
                    </div>
                </motion.div>
            </div>

            {/* Search & Filter Bar */}
            <div className="glass-card p-2 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-2 sticky top-4 z-20 backdrop-blur-xl bg-[#0f172a]/80 shadow-2xl">
                <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                        type="text"
                        placeholder="بحث برقم الفاتورة أو اسم العميل..."
                        className="h-12 pr-12 text-lg bg-white/5 border-transparent focus:bg-white/10 rounded-xl transition-all"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setFilterType('all')}
                        className={cn("flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1 md:gap-2", filterType === 'all' ? "bg-purple-600 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5")}
                    >
                        <ShoppingBag className="h-4 w-4" /> <span className="hidden sm:inline">الكل</span>
                    </button>
                    <button
                        onClick={() => setFilterType('cash')}
                        className={cn("flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1 md:gap-2", filterType === 'cash' ? "bg-emerald-600 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5")}
                    >
                        <Banknote className="h-4 w-4" /> <span className="hidden sm:inline">نقدي</span>
                    </button>
                    <button
                        onClick={() => setFilterType('credit')}
                        className={cn("flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1 md:gap-2", filterType === 'credit' ? "bg-amber-600 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5")}
                    >
                        <CreditCard className="h-4 w-4" /> <span className="hidden sm:inline">آجل</span>
                    </button>
                </div>
            </div>

            {/* Smart List */}
            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
            ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                    <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold">لا توجد فواتير</h3>
                    <p>لم يتم العثور على فواتير مطابقة للبحث</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredInvoices.map((inv, i) => {
                            const paymentType = inv.paymentType || 'cash';
                            const isCash = paymentType === 'cash';

                            return (
                                <motion.div
                                    key={inv._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link href={`/invoices/${inv._id}`}>
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
                                                        <span className="truncate px-1">#{inv.number}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                                                            <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0 text-muted-foreground" />
                                                            <span className="text-xs md:text-sm font-semibold text-foreground/80 truncate">
                                                                {format(new Date(inv.date), 'dd MMM yyyy', { locale: ar })}
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
                                                            {inv.customerName || inv.customer?.name || 'عميل نقدي'}
                                                        </h3>
                                                    </div>
                                                    <div className="text-[10px] md:text-xs text-foreground/60 flex items-center gap-2 mr-6 md:mr-7 truncate">
                                                        <span className="truncate font-medium">بواسطة: {inv.createdBy?.name || '-'}</span>
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className="text-left md:pl-6 md:border-l border-white/5 mt-2 md:mt-0">
                                                    <div className="text-xl md:text-2xl font-black text-purple-500 tracking-tight flex items-baseline gap-1 md:gap-1.5 justify-end">
                                                        {inv.total.toFixed(2)}
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
                                                    onClick={(e) => handleDelete(inv._id, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

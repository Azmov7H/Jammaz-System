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

import { KPICard } from '@/components/dashboard/KPICard';
import { InvoiceListItem } from '@/components/invoices/InvoiceListItem';

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

    const { data: invoicesData, isLoading } = useInvoices(debouncedSearch);
    const invoices = invoicesData?.invoices || [];
    const deleteMutation = useDeleteInvoice();

    const handleDelete = (id) => {
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
                <KPICard
                    title="إجمالي المبيعات"
                    value={totalSales.toLocaleString()}
                    unit=" ج.م"
                    icon={TrendingUp}
                    variant="primary"
                />

                <KPICard
                    title="عدد الفواتير"
                    value={invoicesCount}
                    unit=" فاتورة"
                    icon={FileText}
                    variant="secondary"
                />

                <div className="grid grid-cols-2 gap-4">
                    <KPICard
                        title="نقدي"
                        value={cashInvoices.length}
                        unit=""
                        icon={Banknote}
                        variant="success"
                    />
                    <KPICard
                        title="آجل"
                        value={creditInvoices.length}
                        unit=""
                        icon={CreditCard}
                        variant="warning"
                    />
                </div>

                <KPICard
                    title="متوسط الفاتورة"
                    value={avgInvoiceValue.toFixed(0)}
                    unit=" ج.م"
                    icon={Wallet}
                    variant="default"
                />
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
                        {filteredInvoices.map((inv) => (
                            <InvoiceListItem
                                key={inv._id}
                                invoice={inv}
                                onDelete={handleDelete}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

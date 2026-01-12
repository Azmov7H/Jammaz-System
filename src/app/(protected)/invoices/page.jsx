'use client';

import { useInvoicesPage } from '@/hooks/useInvoicesPage';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { KPICard } from '@/components/dashboard/KPICard';
import { InvoiceListItem } from '@/components/invoices/InvoiceListItem';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Receipt,
    Plus,
    Search,
    ShoppingBag,
    TrendingUp,
    FileText,
    Banknote,
    CreditCard,
    Loader2
} from 'lucide-react';

export default function InvoicesPage() {
    const {
        searchTerm,
        filterType, setFilterType,
        handleSearch,
        handleDelete,
        filteredInvoices,
        isLoading,
        stats
    } = useInvoicesPage();

    const { totalSales, invoicesCount, cashInvoices, creditInvoices } = stats;

    return (
        <div className="space-y-8 animate-fade-in-up" dir="rtl">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
                            <Receipt className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">فواتير المبيعات</h1>
                            <p className="text-muted-foreground font-medium mt-1">إدارة وتتبع جميع العمليات التجارية والمالية</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-3 w-full lg:w-auto"
                >
                    <Link href="/invoices/new" className="w-full lg:w-auto">
                        <Button className="w-full h-14 px-8 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-colored hover:scale-105 active:scale-95 transition-all gap-2">
                            <Plus className="h-5 w-5" />
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

                <KPICard
                    title="التحصيل النقدي"
                    value={cashInvoices.length}
                    unit=" فاتورة"
                    icon={Banknote}
                    variant="success"
                />

                <KPICard
                    title="المبيعات الآجلة"
                    value={creditInvoices.length}
                    unit=" فاتورة"
                    icon={CreditCard}
                    variant="warning"
                />
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-card/50 backdrop-blur-xl p-3 border border-white/5 rounded-[2rem] shadow-custom-xl flex flex-col md:flex-row gap-4 sticky top-24 z-20">
                <div className="relative flex-1 group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors h-5 w-5" />
                    <Input
                        type="text"
                        placeholder="بحث برقم الفاتورة أو اسم العميل..."
                        className="h-12 pr-12 text-lg bg-background border-white/5 focus-visible:ring-primary/20 rounded-xl transition-all font-bold"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
                <div className="flex bg-muted/30 p-1.5 rounded-2xl backdrop-blur-md">
                    <button
                        onClick={() => setFilterType('all')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2",
                            filterType === 'all' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        <ShoppingBag className="h-4 w-4" /> الكل
                    </button>
                    <button
                        onClick={() => setFilterType('cash')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2",
                            filterType === 'cash' ? "bg-emerald-600 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        <Banknote className="h-4 w-4" /> نقدي
                    </button>
                    <button
                        onClick={() => setFilterType('credit')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2",
                            filterType === 'credit' ? "bg-amber-600 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        <CreditCard className="h-4 w-4" /> آجل
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

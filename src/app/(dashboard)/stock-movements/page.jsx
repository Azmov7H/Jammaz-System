'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, Package, TrendingUp, TrendingDown,
    ArrowRightLeft, FileEdit, Filter, Search,
    Calendar, Layers, ArrowUpRight, ArrowDownRight,
    ArrowLeftRight, AlertCircle, CheckCircle2, History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function StockMovementsPage() {
    const [days, setDays] = useState(30);
    const [searchProduct, setSearchProduct] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // ALL, IN, OUT, TRANSFER, ADJUST

    const { data, isLoading } = useQuery({
        queryKey: ['stock-movements', days],
        queryFn: async () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const res = await fetch(
                `/api/stock/movements?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
            );
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        }
    });

    const movements = data?.movements || [];

    // Filter Logic
    const filteredMovements = useMemo(() => {
        return movements.filter(m => {
            const matchesSearch = !searchProduct ||
                m.productId?.name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
                m.productId?.code?.toLowerCase().includes(searchProduct.toLowerCase());

            const matchesType = filterType === 'ALL' ||
                (filterType === 'IN' && m.type === 'IN') ||
                (filterType === 'OUT' && (m.type === 'OUT' || m.type === 'SALE')) ||
                (filterType === 'TRANSFER' && (m.type === 'TRANSFER_TO_SHOP' || m.type === 'TRANSFER_TO_WAREHOUSE')) ||
                (filterType === 'ADJUST' && m.type === 'ADJUST');

            return matchesSearch && matchesType;
        });
    }, [movements, searchProduct, filterType]);

    // Stats Logic
    const stats = useMemo(() => {
        return {
            total: movements.length,
            in: movements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.qty, 0),
            out: movements.filter(m => ['OUT', 'SALE'].includes(m.type)).reduce((acc, m) => acc + m.qty, 0),
            transfers: movements.filter(m => m.type.includes('TRANSFER')).length
        };
    }, [movements]);

    const getTypeConfig = (type) => {
        switch (type) {
            case 'SALE': return { label: 'مبيعات', icon: TrendingDown, color: 'red', bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' };
            case 'OUT': return { label: 'صرف مخزني', icon: ArrowUpRight, color: 'orange', bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' };
            case 'IN': return { label: 'توريد جديد', icon: TrendingUp, color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' };
            case 'TRANSFER_TO_SHOP': return { label: 'تحويل للمحل', icon: ArrowRightLeft, color: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
            case 'TRANSFER_TO_WAREHOUSE': return { label: 'تحويل للمخزن', icon: ArrowRightLeft, color: 'indigo', bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' };
            case 'ADJUST': return { label: 'تسوية جردية', icon: FileEdit, color: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' };
            default: return { label: 'حركة عامة', icon: Package, color: 'slate', bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' };
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-6 p-1 md:p-6" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <History className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tight">سجل حركات المخزون</h1>
                            <p className="text-muted-foreground font-medium">تتبع شامل لجميع عمليات الدخول والخروج والتحويلات</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex p-1 bg-white/5 rounded-2xl border border-white/5"
                >
                    {[
                        { label: '7 أيام', val: 7 },
                        { label: '30 يوم', val: 30 },
                        { label: '90 يوم', val: 90 }
                    ].map((period) => (
                        <button
                            key={period.val}
                            onClick={() => setDays(period.val)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl font-bold transition-all text-sm relative",
                                days === period.val ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            {period.label}
                            {days === period.val && (
                                <motion.div
                                    layoutId="activePeriod"
                                    className="absolute inset-0 bg-primary rounded-xl -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'إجمالي الحركات', value: stats.total, icon: Layers, color: 'blue' },
                    { label: 'وارد (شراء)', value: stats.in, icon: TrendingUp, color: 'emerald' },
                    { label: 'صادر (بيع/صرف)', value: stats.out, icon: TrendingDown, color: 'red' },
                    { label: 'تحويلات داخلية', value: stats.transfers, icon: ArrowRightLeft, color: 'indigo' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-6 rounded-[2rem] border border-white/10 hover:border-primary/20 transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-muted-foreground opacity-80">{stat.label}</p>
                            <h3 className="text-3xl font-black mt-1">{stat.value.toLocaleString()}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Controls & Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-3 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col md:flex-row gap-4 items-center"
            >
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                        placeholder="بحث باسم المنتج أو الكود..."
                        className="h-14 pr-14 rounded-2xl bg-white/5 border-white/5 focus:bg-white/10 transition-all font-bold text-lg"
                        value={searchProduct}
                        onChange={e => setSearchProduct(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 px-1">
                    {[
                        { id: 'ALL', label: 'الكل', icon: Layers },
                        { id: 'IN', label: 'وارد', icon: TrendingUp },
                        { id: 'OUT', label: 'صادر', icon: TrendingDown },
                        { id: 'TRANSFER', label: 'تحويلات', icon: ArrowRightLeft },
                        { id: 'ADJUST', label: 'تسويات', icon: FileEdit },
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setFilterType(type.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap border",
                                filterType === type.id
                                    ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                                    : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10"
                            )}
                        >
                            <type.icon className="h-4 w-4" />
                            {type.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Stock Movements List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-bold text-muted-foreground">جاري تحميل السجل...</p>
                    </div>
                ) : filteredMovements.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card p-12 rounded-[2.5rem] text-center border border-white/10 flex flex-col items-center gap-6"
                    >
                        <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center">
                            <Package className="h-10 w-10 text-muted-foreground opacity-50" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">لا توجد حركات مسجلة</h3>
                            <p className="text-muted-foreground mt-2 font-medium">لم يتم العثور على أي حركات مخزنية في الفترة المحددة</p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        <AnimatePresence mode="popLayout">
                            {filteredMovements.map((movement, i) => {
                                const config = getTypeConfig(movement.type);
                                return (
                                    <motion.div
                                        key={movement._id || i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="glass-card p-4 rounded-[1.5rem] border border-white/5 hover:bg-white/5 transition-colors group relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 right-0 w-1 h-full ${config.bg.replace('/10', '')}`} />

                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                                            {/* Icon & Time */}
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg", config.bg, config.text)}>
                                                    <config.icon className="h-7 w-7" />
                                                </div>
                                                <div className="flex flex-col md:hidden">
                                                    <span className="text-xs font-bold text-muted-foreground">
                                                        {format(new Date(movement.date), 'dd MMMM yyyy', { locale: ar })}
                                                    </span>
                                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-muted-foreground w-fit mt-1">
                                                        {format(new Date(movement.date), 'hh:mm a', { locale: ar })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-lg text-foreground group-hover:text-primary transition-colors">
                                                        {movement.productId?.name || 'منتج غير موجود'}
                                                    </h3>
                                                    <Badge variant="outline" className="font-mono text-[10px] tracking-wider border-white/10 bg-white/5">
                                                        {movement.productId?.code}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
                                                    <span className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold", config.bg, config.text)}>
                                                        {config.label}
                                                    </span>
                                                    {movement.note && (
                                                        <span className="flex items-center gap-1.5 opacity-80">
                                                            <AlertCircle className="h-3.5 w-3.5" />
                                                            {movement.note}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details & Qty */}
                                            <div className="flex items-center justify-between w-full md:w-auto gap-8 pl-4 border-t md:border-t-0 md:border-r border-white/5 pt-4 md:pt-0 mt-2 md:mt-0">
                                                <div className="text-center min-w-[80px] hidden md:block">
                                                    <p className="text-xs font-bold text-muted-foreground mb-1">التاريخ</p>
                                                    <p className="font-bold text-sm">
                                                        {format(new Date(movement.date), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>

                                                {movement.snapshot && (
                                                    <div className="flex gap-2">
                                                        <div className="flex flex-col items-center px-3 py-1 rounded-xl bg-white/5 border border-white/5">
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">مخزن</span>
                                                            <span className="text-xs font-black">{movement.snapshot.warehouseQty}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center px-3 py-1 rounded-xl bg-white/5 border border-white/5">
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">محل</span>
                                                            <span className="text-xs font-black">{movement.snapshot.shopQty}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-col items-end min-w-[80px]">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">الكمية</span>
                                                    <span className={cn("text-2xl font-black tabular-nums", config.text)}>
                                                        {movement.qty > 0 ? '+' : ''}{movement.qty}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

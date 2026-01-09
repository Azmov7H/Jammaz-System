'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    Filter,
    Loader2,
    Eye,
    ClipboardCheck,
    Warehouse,
    Store,
    Layers,
    Calendar,
    ChevronLeft,
    EyeOff,
    TrendingUp,
    TrendingDown,
    Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PhysicalInventoryPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');

    const fetchCounts = async () => {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (locationFilter !== 'all') params.append('location', locationFilter);

        const res = await fetch(`/api/physical-inventory?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch counts');
        return res.json();
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['physical-inventory', statusFilter, locationFilter],
        queryFn: fetchCounts,
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 rounded-lg font-black flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        مكتمل
                    </Badge>
                );
            case 'draft':
                return (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1 rounded-lg font-black flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        مسودة جارية
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="destructive" className="px-3 py-1 rounded-lg font-black">
                        ملغي
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getLocationBadge = (location) => {
        const styles = {
            warehouse: { label: 'المخزن الرئيسي', icon: Warehouse, color: 'text-indigo-600 bg-indigo-500/10' },
            shop: { label: 'المحل', icon: Store, color: 'text-rose-600 bg-rose-500/10' },
            both: { label: 'شامل', icon: Layers, color: 'text-primary bg-primary/10' }
        };
        const config = styles[location] || styles.both;
        return (
            <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs", config.color)}>
                <config.icon size={14} />
                {config.label}
            </div>
        );
    };

    return (
        <div className="container max-w-7xl mx-auto space-y-8 pb-20 px-4">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-[1.5rem] gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
                            <ClipboardCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight">مركز الجرد الفعلي</h1>
                            <p className="text-muted-foreground font-medium">إدارة ومطابقة المخزون والرقابة المالية على الأصناف</p>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => router.push('/physical-inventory/new')}
                    className="h-14 px-8 rounded-2xl gradient-primary border-0 shadow-lg shadow-primary/20 hover-scale group font-black text-lg"
                >
                    <Plus className="ml-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                    بدء جرد جديد
                </Button>
            </div>

            {/* Filters Bar */}
            <Card className="glass-card border-0 shadow-custom-xl rounded-[2rem] overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute right-4 top-4 h-5 w-5 text-muted-foreground/40" />
                            <Input
                                placeholder="بحث بتسلسل الجرد أو الملاحظات..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-14 pr-12 rounded-[1.25rem] bg-muted/40 border-0 font-bold focus:ring-4 ring-primary/10 transition-all text-lg"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-14 w-[160px] rounded-[1.25rem] bg-muted/40 border-0 font-bold">
                                    <SelectValue placeholder="حالة الجرد" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-0 shadow-custom-xl">
                                    <SelectItem value="all" className="font-bold">جميع الحالات</SelectItem>
                                    <SelectItem value="draft" className="font-medium">مسودات</SelectItem>
                                    <SelectItem value="completed" className="font-medium">مكتملة</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger className="h-14 w-[160px] rounded-[1.25rem] bg-muted/40 border-0 font-bold">
                                    <SelectValue placeholder="الموقع" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-0 shadow-custom-xl">
                                    <SelectItem value="all" className="font-bold">جميع المواقع</SelectItem>
                                    <SelectItem value="warehouse" className="font-medium">المخزن الرئيسي</SelectItem>
                                    <SelectItem value="shop" className="font-medium">المحل</SelectItem>
                                    <SelectItem value="both" className="font-medium">شامل</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* List View */}
            <Card className="glass-card border-0 shadow-custom-xl rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-0 hover:bg-transparent">
                                    <TableHead className="font-black py-6 pr-8 text-primary">التاريخ والمعلومات</TableHead>
                                    <TableHead className="font-black text-center">الموقع والقسم</TableHead>
                                    <TableHead className="font-black text-center">الحالة</TableHead>
                                    <TableHead className="font-black text-center">نوع الجرد</TableHead>
                                    <TableHead className="font-black text-center">الفروقات المكتشفة</TableHead>
                                    <TableHead className="font-black text-left pl-8">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                                <p className="font-bold text-muted-foreground">جاري جلب سجلات الجرد...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : data?.counts?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                                <Activity className="w-16 h-16" />
                                                <p className="text-xl font-black">لا توجد عمليات جرد مسجلة حالياً</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {data?.counts?.map((count, index) => (
                                            <motion.tr
                                                key={count._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group border-b border-muted/20 hover:bg-muted/5 transition-colors"
                                            >
                                                <TableCell className="py-6 pr-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                                                            <Calendar className="w-5 h-5 text-muted-foreground/60" />
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-base">
                                                                {format(new Date(count.date), 'dd MMMM yyyy', { locale: ar })}
                                                            </div>
                                                            <div className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                                                                BY: {count.createdBy?.name || 'SYSTEM'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        {getLocationBadge(count.location)}
                                                        {count.category && (
                                                            <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary/70">
                                                                SECTION: {count.category}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="flex justify-center">
                                                        {getStatusBadge(count.status)}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="flex justify-center">
                                                        {count.isBlind ? (
                                                            <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 px-3 py-1 rounded-lg font-black flex items-center gap-1.5">
                                                                <EyeOff size={14} />
                                                                جرد أعمى
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground/60 font-black">
                                                                عادي
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    {count.status === 'draft' && count.isBlind ? (
                                                        <span className="text-muted-foreground/30 font-black italic">مخفي</span>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <div className={cn(
                                                                "text-lg font-black tabular-nums tracking-tighter",
                                                                count.netDifference > 0 ? "text-emerald-500" : count.netDifference < 0 ? "text-rose-500" : "text-muted-foreground/40"
                                                            )} dir="ltr">
                                                                {count.netDifference > 0 ? `+${count.netDifference}` : count.netDifference}
                                                            </div>
                                                            <div className="text-[10px] font-bold opacity-40 uppercase">DISCREPANCY</div>
                                                        </div>
                                                    )}
                                                </TableCell>

                                                <TableCell className="text-left pl-8">
                                                    <Button
                                                        variant="ghost"
                                                        size="lg"
                                                        className="h-12 rounded-xl bg-muted/40 hover:bg-primary/10 hover:text-primary transition-all font-black gap-2 group/btn"
                                                        onClick={() => router.push(`/physical-inventory/${count._id}`)}
                                                    >
                                                        {count.status === 'draft' ? 'استكمال الجرد' : 'عرض التفاصيل'}
                                                        <Eye className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                                                    </Button>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


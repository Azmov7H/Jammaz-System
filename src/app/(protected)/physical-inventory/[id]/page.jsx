'use client';


import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    ArrowRight,
    Save,
    CheckCircle,
    AlertTriangle,
    Search,
    ScanBarcode,
    Zap,
    Trash2,
    History,
    FileText,
    TrendingUp,
    TrendingDown,
    Activity,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    X,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import { Suspense } from 'react';

function InternalPhysicalInventoryDetailPage({ params }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { id } = use(params);
    const [search, setSearch] = useState('');
    const [barcode, setBarcode] = useState('');
    const [localItems, setLocalItems] = useState([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isScannerFocused, setIsScannerFocused] = useState(false);
    const [lastScanned, setLastScanned] = useState(null);
    const [unlockPassword, setUnlockPassword] = useState('');
    const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [justifyingItem, setJustifyingItem] = useState(null);
    const [movementsSinceSnapshot, setMovementsSinceSnapshot] = useState({});
    const scannerInputRef = useRef(null);
    const scrollRef = useRef(null);

    // Audio effects simulation
    const playSuccessSound = () => {
        // In a real app, we'd use new Audio('/sounds/success.mp3').play()
        console.log('Success Sound');
    };
    const playErrorSound = () => {
        console.log('Error Sound');
    };

    // Fetch Count Data
    const { data: count, isLoading, error } = useQuery({
        queryKey: ['physical-inventory', id],
        queryFn: async () => {
            const res = await fetch(`/api/physical-inventory/${id}`);
            if (!res.ok) throw new Error('Failed to fetch count');
            const data = await res.json();
            return data.data.count;
        },
        enabled: !!id,
    });

    // Initialize local state when data loads
    useEffect(() => {
        if (count) {
            setLocalItems(count.items);
            setHasUnsavedChanges(false);

            // Fetch movements since snapshot
            const fetchRecentMovements = async () => {
                try {
                    const res = await fetch(`/api/physical-inventory/${id}/recent-movements`);
                    const data = await res.json();
                    if (data.movements) setMovementsSinceSnapshot(data.movements);
                } catch (e) { console.error(e); }
            };
            fetchRecentMovements();
        }
    }, [count, id]);

    // Save Changes Mutation
    const saveMutation = useMutation({
        mutationFn: async (items) => {
            const res = await fetch(`/api/physical-inventory/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            if (!res.ok) throw new Error('Failed to save changes');
            return res.json();
        },
        onSuccess: () => {
            toast.success('تم حفظ التغييرات بنجاح');
            setHasUnsavedChanges(false);
            queryClient.invalidateQueries(['physical-inventory', id]);
        },
        onError: (err) => toast.error(err.message),
    });

    // Complete Count Mutation
    const completeMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/physical-inventory/${id}/complete`, {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to complete count');
            return data.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            router.push('/physical-inventory');
        },
        onError: (err) => toast.error(err.message),
    });

    // Unlock Count Mutation
    const unlockMutation = useMutation({
        mutationFn: async (password) => {
            const res = await fetch(`/api/physical-inventory/${id}/unlock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل فتح الجرد');
            return data.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setIsUnlockDialogOpen(false);
            setUnlockPassword('');
            // Manually update the query data for immediate UI response
            queryClient.setQueryData(['physical-inventory', id], (old) => ({
                ...old,
                status: 'draft'
            }));
            queryClient.invalidateQueries(['physical-inventory', id]);
        },
        onError: (err) => toast.error(err.message),
    });

    // Handle quantity change
    const handleQuantityChange = (productId, newQty, justificationData = null) => {
        const qty = parseFloat(newQty) || 0;
        setLocalItems(prev => prev.map(item => {
            if (item.productId._id === productId) {
                const diff = qty - item.systemQty;
                return {
                    ...item,
                    actualQty: qty,
                    difference: diff,
                    value: diff * (item.buyPrice || 0),
                    ...justificationData
                };
            }
            return item;
        }));
        setHasUnsavedChanges(true);
        if (justificationData) setJustifyingItem(null);
    };

    const openJustification = (item) => {
        setJustifyingItem(item);
    };

    // Handle Barcode Scan
    const handleBarcodeSubmit = (e) => {
        e.preventDefault();
        if (!barcode.trim()) return;

        const targetItem = localItems.find(item =>
            item.productCode === barcode.trim() ||
            item.productName.includes(barcode.trim())
        );

        if (targetItem) {
            handleQuantityChange(targetItem.productId._id, targetItem.actualQty + 1);
            setLastScanned({
                name: targetItem.productName,
                time: new Date()
            });
            setBarcode('');
            // Play a success sound effect visually
            toast.success(`تمت إضافة: ${targetItem.productName}`, {
                icon: <Zap className="w-4 h-4 text-emerald-500" />,
                duration: 1500
            });
        } else {
            toast.error('المنتج غير موجود في قائمة الجرد الحالية');
            setBarcode('');
        }
    };

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!search) return localItems;
        return localItems.filter(item =>
            item.productName.toLowerCase().includes(search.toLowerCase()) ||
            item.productCode.toLowerCase().includes(search.toLowerCase())
        );
    }, [localItems, search]);

    // Calculate live discrepancies
    const discrepancies = useMemo(() => {
        const diffs = localItems.filter(i => i.difference !== 0);
        const shortage = diffs.filter(i => i.difference < 0).reduce((sum, i) => sum + Math.abs(i.difference), 0);
        const surplus = diffs.filter(i => i.difference > 0).reduce((sum, i) => sum + i.difference, 0);
        const valueImpact = diffs.reduce((sum, i) => sum + i.value, 0);

        return { count: diffs.length, shortage, surplus, valueImpact };
    }, [localItems]);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-40 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-bold text-muted-foreground animate-pulse">جاري تحميل بيانات الجرد...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center p-40 gap-4 text-rose-500">
            <AlertTriangle className="h-16 w-16" />
            <p className="text-xl font-black">خطأ في التحميل: {error.message}</p>
            <Button onClick={() => router.refresh()} variant="outline">إعادة المحاولة</Button>
        </div>
    );

    const isCompleted = count.status === 'completed';
    const isBlind = count.isBlind && !isCompleted;

    return (
        <div className="container max-w-7xl mx-auto space-y-8 pb-20 px-4">
            {/* Action Bar & Quick Info */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex flex-col gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit mb-2 hover:bg-primary/5 text-muted-foreground group"
                        onClick={() => router.push('/physical-inventory')}
                    >
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        العودة للمركز الرئيسي
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/5 rotate-3">
                            <Activity className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                جرد: {count.location === 'warehouse' ? 'المخزن الرئيسي' : count.location === 'shop' ? 'المحل' : 'شامل'}
                                <Badge className={cn(
                                    "px-4 py-1 rounded-full font-black text-xs",
                                    isCompleted ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-amber-500 text-white shadow-amber-500/20"
                                )}>
                                    {isCompleted ? 'مكتمل ومعتمد' : 'مسودة قيد العمل'}
                                </Badge>
                                {count.category && (
                                    <Badge variant="outline" className="px-4 py-1 rounded-full border-primary/30 text-primary font-bold">
                                        قسم: {count.category}
                                    </Badge>
                                )}
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium mt-1">
                                {format(new Date(count.date), 'EEEE, dd MMMM yyyy - hh:mm a', { locale: ar })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                    {isCompleted && (
                        <AlertDialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-14 px-8 rounded-2xl border-rose-500/20 text-rose-600 hover:bg-rose-50 hover:border-rose-500/40 font-black"
                                >
                                    <Unlock className="ml-2 h-4 w-4" />
                                    تعديل الجرد (كلمة سر المالك)
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2.5rem] border-0 glass-card">
                                <AlertDialogHeader className="pb-4">
                                    <AlertDialogTitle className="text-2xl font-black flex items-center gap-2">
                                        <Lock className="w-6 h-6 text-rose-600" />
                                        يتطلب صلاحية المالك
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-base font-medium">
                                        هذا الجرد معتمد ومكتمل. لتعديله، يجب إدخال كلمة مرور المالك لتحويله إلى وضع "المسودة".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                    {/* Honeypot to prevent autocomplete */}
                                    <input type="text" style={{ display: 'none' }} aria-hidden="true" />
                                    <Label className="font-bold mb-2 block text-right">كلمة مرور المالك</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={unlockPassword}
                                        onChange={(e) => setUnlockPassword(e.target.value)}
                                        className="h-12 rounded-xl border-muted bg-muted/20 text-center"
                                        onKeyDown={(e) => e.key === 'Enter' && unlockMutation.mutate(unlockPassword)}
                                        autoComplete="new-password"
                                        name="unlock-password-field"
                                    />
                                </div>
                                <AlertDialogFooter className="gap-3">
                                    <AlertDialogCancel className="h-12 rounded-xl font-bold border-0 bg-muted">إلغاء</AlertDialogCancel>
                                    <Button
                                        onClick={() => unlockMutation.mutate(unlockPassword)}
                                        disabled={unlockMutation.isPending || !unlockPassword}
                                        className="h-12 rounded-xl font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20"
                                    >
                                        {unlockMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : "تأكيد الهوية"}
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {!isCompleted && (
                        <motion.div
                            className="flex gap-3 w-full lg:w-auto"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => setFocusMode(true)}
                                className="h-14 px-8 rounded-2xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-black text-primary flex-1 lg:flex-none"
                            >
                                <Zap className="ml-2 h-4 w-4 fill-primary/20" />
                                وضع التركيز (Wizard)
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => {
                                    if (isCompleted) {
                                        toast.error('لا يمكن تعديل جرد مكتمل');
                                        return;
                                    }
                                    saveMutation.mutate(localItems);
                                }}
                                disabled={!hasUnsavedChanges || saveMutation.isPending}
                                className="h-14 px-8 rounded-2xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-black flex-1 lg:flex-none"
                            >
                                {saveMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                                حفظ المسودة
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="lg"
                                        disabled={hasUnsavedChanges}
                                        className="h-14 px-10 rounded-2xl gradient-primary border-0 shadow-lg shadow-primary/20 font-black flex-1 lg:flex-none"
                                    >
                                        <CheckCircle className="ml-2 h-4 w-4" />
                                        اعتماد الجرد نهائياً
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[2.5rem] border-0 glass-card">
                                    <AlertDialogHeader className="pb-4">
                                        <AlertDialogTitle className="text-2xl font-black">هل أنت متأكد من الاعتماد؟</AlertDialogTitle>
                                        <AlertDialogDescription asChild>
                                            <div className="text-base font-medium">
                                                عند الضغط على "تأكيد"، سيقوم النظام بـ:
                                                <ul className="list-disc pr-6 mt-4 space-y-2 text-rose-600 font-black">
                                                    <li>تعديل كميات الأصناف فعلياً في المخزن المختار.</li>
                                                    <li>تسجيل قيود محاسبية بالفوارق المالية المكتشفة.</li>
                                                    <li>أرشفة هذه الجلسة ولا يمكن التعديل عليها بعدها.</li>
                                                </ul>
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-3">
                                        <AlertDialogCancel className="h-12 rounded-xl font-bold border-0 bg-muted">إلغاء التراجع</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => completeMutation.mutate()}
                                            className="h-12 rounded-xl font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20"
                                        >
                                            تأكيد واعتماد الكميات
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Smart Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: 'تقدم الجرد',
                        value: `${Math.round(localItems.filter(i => i.actualQty > 0 || i.justificationReason).length / localItems.length * 100)}%`,
                        icon: Activity,
                        color: 'primary',
                        customContent: (
                            <div className="relative h-16 w-16 mx-auto">
                                <svg className="h-full w-full" viewBox="0 0 36 36">
                                    <path className="stroke-muted fill-none" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <motion.path
                                        className="stroke-primary fill-none"
                                        strokeWidth="3"
                                        strokeDasharray={`${Math.round(localItems.filter(i => i.actualQty > 0 || i.justificationReason).length / localItems.length * 100)}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">
                                    {Math.round(localItems.filter(i => i.actualQty > 0 || i.justificationReason).length / localItems.length * 100)}%
                                </div>
                            </div>
                        )
                    },
                    {
                        label: 'معدل المطابقة',
                        value: isBlind ? '---' : `${Math.round((localItems.length - discrepancies.count) / localItems.length * 100)}%`,
                        icon: Zap,
                        color: isBlind ? 'primary' : (discrepancies.count > 0 ? 'amber' : 'emerald'),
                        sub: isBlind ? 'مخفي في وضع الجرد الأعمى' : `${discrepancies.count} صنف غير مطابق`
                    },
                    {
                        label: 'الأصناف المتأثرة',
                        value: isBlind ? '---' : discrepancies.count,
                        icon: AlertTriangle,
                        color: isBlind ? 'primary' : 'rose',
                        sub: 'بحاجة لتبرير أو مراجعة'
                    },
                    {
                        label: 'الأثر المالي المتوقع',
                        value: isBlind ? '---' : discrepancies.valueImpact.toLocaleString(),
                        symbol: isBlind ? '' : 'ج.م',
                        icon: TrendingUp,
                        color: isBlind ? 'primary' : (discrepancies.valueImpact >= 0 ? 'emerald' : 'rose')
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="glass-card border-0 shadow-custom-xl overflow-hidden rounded-3xl h-full">
                            <CardContent className="p-6 relative">
                                <div className={cn(
                                    "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 bg-gradient-to-br",
                                    `from-${stat.color}-500 to-transparent`
                                )} />
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn("p-3 rounded-2xl", `bg-${stat.color}-500/10`)}>
                                        <stat.icon className={cn("w-6 h-6", `text-${stat.color}-500`)} />
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase opacity-60">Insight</Badge>
                                </div>
                                <h3 className="text-sm font-bold text-muted-foreground">{stat.label}</h3>
                                {stat.customContent ? (
                                    <div className="mt-2">{stat.customContent}</div>
                                ) : (
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-3xl font-black tracking-tighter">{stat.value}</span>
                                        {stat.symbol && <span className="text-sm font-black text-muted-foreground">{stat.symbol}</span>}
                                    </div>
                                )}
                                {stat.sub && <p className="text-[10px] font-bold mt-2 text-muted-foreground/60">{stat.sub}</p>}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Scanner Mode Control Bar */}
            <AnimatePresence>
                {!isCompleted && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className={cn(
                            "glass-card border-2 transition-all duration-500 overflow-hidden rounded-[2.5rem]",
                            isScannerFocused ? "border-primary/50 shadow-2xl scale-[1.01]" : "border-transparent shadow-custom-xl"
                        )}>
                            <CardContent className="p-6">
                                <form onSubmit={handleBarcodeSubmit} className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="flex-1 w-full space-y-2">
                                        <Label className="text-sm font-black flex items-center gap-2 mr-2">
                                            <ScanBarcode className="w-5 h-5 text-primary rotate-12" /> وضع الماسح السريع (Scanner Mode)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                ref={scannerInputRef}
                                                placeholder="امسح الباركود هنا للإضافة التلقائية..."
                                                value={barcode}
                                                onChange={(e) => setBarcode(e.target.value)}
                                                onFocus={() => setIsScannerFocused(true)}
                                                onBlur={() => setIsScannerFocused(false)}
                                                className="h-16 rounded-2xl bg-muted/40 border-0 text-xl font-bold pr-14 focus:ring-4 ring-primary/20 transition-all text-center"
                                                autoComplete="off"
                                                name="barcode-scanner-input"
                                            />
                                            <Search className="absolute right-5 top-5 h-6 w-6 text-muted-foreground/40" />
                                            <div className="absolute left-4 top-4">
                                                <Badge className="bg-primary/10 text-primary border-0 font-black px-3 py-1 animate-pulse">
                                                    READY TO SCAN
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {lastScanned && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 min-w-64"
                                        >
                                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                                <History className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest leading-none mb-1">Last Scanned</p>
                                                <h4 className="text-sm font-bold truncate max-w-44 leading-none">{lastScanned.name}</h4>
                                            </div>
                                        </motion.div>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inventory Table & Listing */}
            <Card className="glass-card border-0 shadow-custom-xl overflow-hidden rounded-[2.5rem]">
                <CardHeader className="p-8 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <CardTitle className="text-2xl font-black">قائمة المواد</CardTitle>
                            <div className="relative flex-1 min-w-64 lg:min-w-96">
                                <Search className="absolute right-4 top-3.5 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    placeholder="بحث سريع باسم المنتج أو الكود..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-11 rounded-xl bg-muted/30 border-0 pr-10 font-bold"
                                    autoComplete="off"
                                    name="inventory-search-main"
                                />
                            </div>
                        </div>

                        {isBlind && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 font-bold text-xs">
                                <EyeOff className="w-4 h-4" /> وضع الجرد الأعمى نشط: الفروقات مخفية حتى يتم الاعتماد.
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-0 hover:bg-transparent">
                                    <TableHead className="w-[350px] font-black py-6 pr-8 text-primary">المنتج والتفاصيل</TableHead>
                                    <TableHead className="font-black text-center">الكمية المقررة</TableHead>
                                    <TableHead className="w-[200px] font-black text-center text-primary">الكمية الفعلية (جرد)</TableHead>
                                    <TableHead className="font-black text-center">حالة المطابقة</TableHead>
                                    {!isBlind && <TableHead className="font-black text-left pl-8">الأثر المالي</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {filteredItems.map((item, index) => (
                                        <motion.tr
                                            key={index}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(index * 0.05, 1) }}
                                            className={cn(
                                                "border-b border-muted/20 hover:bg-muted/5 transition-colors group",
                                                !isBlind && item.difference !== 0 ? 'bg-rose-500/[0.02]' : '',
                                                (item.productId && movementsSinceSnapshot[item.productId._id]) ? 'bg-amber-500/[0.03]' : ''
                                            )}
                                        >
                                            <TableCell className="py-6 pr-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center font-black text-xs text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-black text-base">{item.productName}</div>
                                                            {movementsSinceSnapshot[index] && (
                                                                <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 border-0 flex items-center gap-1">
                                                                    <RefreshCw size={8} className="animate-spin" />
                                                                    حركة مؤخراً
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs font-bold text-muted-foreground flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="px-2 py-0 h-4 text-[10px] font-black rounded-sm">{item.productCode}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <span className={cn(
                                                    "text-lg font-black tracking-tight",
                                                    isBlind ? "blur-md select-none opacity-20" : "text-muted-foreground"
                                                )}>
                                                    {isBlind ? '888' : item.systemQty}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    {isCompleted ? (
                                                        <Badge className="h-10 px-6 rounded-xl bg-muted text-muted-foreground border-0 font-black text-lg">
                                                            {item.actualQty}
                                                        </Badge>
                                                    ) : (
                                                        <div className="relative group/input flex items-center">
                                                            <Input
                                                                type="number"
                                                                value={item.actualQty}
                                                                onChange={(e) => handleQuantityChange(item.productId._id, e.target.value)}
                                                                className={cn(
                                                                    "w-32 h-14 rounded-2xl text-center text-xl font-black border-2 transition-all",
                                                                    !isBlind && item.difference !== 0
                                                                        ? 'border-rose-500/30 bg-rose-500/5 text-rose-700'
                                                                        : 'border-transparent bg-muted/40'
                                                                )}
                                                            />
                                                            {Math.abs(item.difference) > (item.systemQty * 0.2) && !item.justificationReason && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => openJustification(item)}
                                                                    className="absolute -left-10 text-rose-500 animate-pulse"
                                                                >
                                                                    <AlertTriangle size={20} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {isBlind ? (
                                                        item.actualQty > 0 ? (
                                                            <Badge className="bg-primary/10 text-primary border-0 font-black rounded-lg">
                                                                <History size={12} className="ml-1" />
                                                                تم الجرد
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-muted text-muted-foreground border-0 font-black rounded-lg">
                                                                بانتظار العد
                                                            </Badge>
                                                        )
                                                    ) : (
                                                        <>
                                                            {item.difference > 0 ? (
                                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-0 font-black rounded-lg">
                                                                    <TrendingUp size={12} className="ml-1" />
                                                                    زيادة {item.difference}+
                                                                </Badge>
                                                            ) : item.difference < 0 ? (
                                                                <Badge className="bg-rose-500/10 text-rose-600 border-0 font-black rounded-lg">
                                                                    <TrendingDown size={12} className="ml-1" />
                                                                    عجز {item.difference}
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-muted text-muted-foreground border-0 font-black rounded-lg">
                                                                    <CheckCircle size={12} className="ml-1" />
                                                                    مطابق
                                                                </Badge>
                                                            )}
                                                            {item.justificationReason && (
                                                                <span className="text-[10px] font-bold text-muted-foreground/50">
                                                                    تم التبرير: {item.justificationReason}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {!isBlind && (
                                                <TableCell className="text-left pl-8">
                                                    <div className={cn(
                                                        "text-lg font-black tracking-tighter",
                                                        item.value > 0 ? "text-emerald-500" : item.value < 0 ? "text-rose-500" : "text-muted-foreground/30"
                                                    )} dir="ltr">
                                                        {item.value === 0 ? '-' : (item.value > 0 ? `+${item.value.toLocaleString()}` : item.value.toLocaleString())}
                                                    </div>
                                                </TableCell>
                                            )}
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <Search className="h-16 w-16 text-muted-foreground/20" />
                            <p className="text-lg font-bold text-muted-foreground">لم يتم العثور على منتجات مطابقة لعملية البحث</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Float Saved Status (Bottom) */}
            <AnimatePresence>
                {(hasUnsavedChanges && !isCompleted) && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 overflow-hidden"
                    >
                        <div className="bg-amber-600 px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-amber-500/50">
                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
                            </div>
                            <div className="text-white">
                                <h4 className="font-black text-sm leading-none">تنبيه: يوجد تغييرات غير محفوظة</h4>
                                <p className="text-[10px] font-bold opacity-80 mt-1">تأكد من الضغط على "حفظ المسودة" قبل الخروج</p>
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-10 rounded-xl px-4 font-black bg-white text-amber-600 hover:bg-white/90"
                                onClick={() => saveMutation.mutate(localItems)}
                                disabled={saveMutation.isPending}
                            >
                                {saveMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "حفظ الآن"}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Justification Dialog */}
            <AlertDialog open={!!justifyingItem} onOpenChange={() => setJustifyingItem(null)}>
                <AlertDialogContent className="rounded-[2.5rem] border-0 glass-card max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                                <AlertTriangle className="text-rose-600 w-6 h-6" />
                            </div>
                            تبرير فرق الجرد
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-bold text-muted-foreground">
                            هناك فرق كبير الملاحظ للصنف: <span className="text-foreground">{justifyingItem?.productName}</span>. يرجى تقديم تبرير لهذا الفرق.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-6 pt-4">
                        <div className="space-y-3">
                            <Label className="font-black text-sm">سبب الفرق</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'damage', label: 'تلف / كسر', icon: Trash2 },
                                    { id: 'expired', label: 'تاريخ منتهى', icon: History },
                                    { id: 'theft', label: 'عجز / سرقة', icon: AlertTriangle },
                                    { id: 'data_error', label: 'خطأ إدخال سابق', icon: FileText },
                                    { id: 'other', label: 'أخرى', icon: Zap }
                                ].map((reason) => (
                                    <Button
                                        key={reason.id}
                                        variant="outline"
                                        onClick={() => {
                                            handleQuantityChange(justifyingItem.productId._id, justifyingItem.actualQty, { justificationReason: reason.id });
                                        }}
                                        className={cn(
                                            "h-12 rounded-xl border-2 font-bold gap-2",
                                            justifyingItem?.justificationReason === reason.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                                        )}
                                    >
                                        <reason.icon size={14} className="text-primary" />
                                        {reason.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="font-black text-sm">ملاحظات إضافية</Label>
                            <Input
                                placeholder="اكتب تفاصيل التبرير هنا..."
                                value={justifyingItem?.justification || ''}
                                onChange={(e) => {
                                    handleQuantityChange(justifyingItem.productId._id, justifyingItem.actualQty, { justification: e.target.value });
                                }}
                                className="h-14 rounded-2xl bg-muted/40 border-0 font-medium"
                            />
                        </div>
                    </div>

                    <AlertDialogFooter className="pt-6">
                        <Button
                            onClick={() => setJustifyingItem(null)}
                            className="w-full h-14 rounded-2xl gradient-primary font-black"
                        >
                            حفظ التبرير والعودة
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Focus Mode Overlay */}
            <AnimatePresence>
                {focusMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setFocusMode(false)}
                                    className="h-12 w-12 rounded-2xl bg-muted/50"
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                                <div>
                                    <h2 className="text-2xl font-black">وضع التركيز للجرد</h2>
                                    <p className="text-sm font-bold text-muted-foreground">جاري عد الصنف {currentIndex + 1} من {localItems.length}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-48 bg-muted/50 rounded-full overflow-hidden relative">
                                        <motion.div
                                            className="absolute inset-y-0 left-0 bg-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((currentIndex + 1) / localItems.length) * 100}%` }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">
                                            {Math.round(((currentIndex + 1) / localItems.length) * 100)}% COMPLETE
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="max-w-4xl w-full">
                                {localItems[currentIndex] && (
                                    <motion.div
                                        key={currentIndex}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        className="space-y-12"
                                    >
                                        <div className="text-center space-y-4">
                                            <Badge className="h-8 px-6 rounded-full bg-primary/10 text-primary font-black text-sm border-0">
                                                {localItems[currentIndex].productCode}
                                            </Badge>
                                            <h1 className="text-6xl font-black tracking-tight leading-tight">
                                                {localItems[currentIndex].productName}
                                            </h1>
                                            {movementsSinceSnapshot[localItems[currentIndex].productId._id] && (
                                                <div className="flex items-center justify-center gap-2 text-amber-500 font-extrabold animate-pulse">
                                                    <RefreshCw size={24} className="animate-spin" />
                                                    تنبيه: تم بيع أو نقل كميات من هذا الصنف أثناء الجرد!
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <Card className="glass-card border-0 rounded-[3rem] p-12 text-center">
                                                <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">كمية النظام</p>
                                                <p className={cn(
                                                    "text-8xl font-black tabular-nums tracking-tighter",
                                                    isBlind ? "blur-2xl opacity-10" : "text-primary/40"
                                                )}>
                                                    {isBlind ? '888' : localItems[currentIndex].systemQty}
                                                </p>
                                            </Card>

                                            <Card className="glass-card border-4 border-primary/20 rounded-[3rem] p-12 text-center shadow-2xl shadow-primary/20">
                                                <p className="text-sm font-black text-primary uppercase tracking-widest mb-4">الكمية الفعلية</p>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        autoFocus
                                                        value={localItems[currentIndex].actualQty || ''}
                                                        onChange={(e) => handleQuantityChange(localItems[currentIndex].productId._id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                if (currentIndex < localItems.length - 1) {
                                                                    setCurrentIndex(prev => prev + 1);
                                                                    playSuccessSound();
                                                                } else {
                                                                    setFocusMode(false);
                                                                    toast.success('تم الانتهاء من جميع الأصناف');
                                                                }
                                                            }
                                                        }}
                                                        className="h-40 border-0 bg-transparent text-center text-[10rem] font-black tabular-nums focus:ring-0"
                                                    />
                                                    {Math.abs(localItems[currentIndex].difference) > (localItems[currentIndex].systemQty * 0.2) && !localItems[currentIndex].justificationReason && (
                                                        <Button
                                                            onClick={() => openJustification(localItems[currentIndex])}
                                                            className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-20 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl h-14 px-8 animate-bounce gap-2"
                                                        >
                                                            <AlertTriangle size={20} />
                                                            يوجد فرق كبير: تبرير الآن؟
                                                        </Button>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-muted-foreground mt-8 opacity-40">اضغط ENTER للانتقال للصنف التالي</p>
                                            </Card>
                                        </div>

                                        <div className="flex items-center justify-between gap-6">
                                            <Button
                                                variant="ghost"
                                                size="xl"
                                                disabled={currentIndex === 0}
                                                onClick={() => setCurrentIndex(prev => prev - 1)}
                                                className="h-20 flex-1 rounded-[2rem] text-2xl font-black gap-4"
                                            >
                                                <ChevronRight className="h-8 w-8" />
                                                الصنف السابق
                                            </Button>

                                            <div className="flex-[0.5] flex items-center justify-center">
                                                <div className="flex gap-2">
                                                    {localItems.map((_, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={cn(
                                                                "h-2 w-2 rounded-full transition-all duration-300",
                                                                idx === currentIndex ? "w-8 bg-primary" : (idx < currentIndex ? "bg-primary/40" : "bg-muted")
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <Button
                                                size="xl"
                                                onClick={() => {
                                                    if (currentIndex < localItems.length - 1) {
                                                        setCurrentIndex(prev => prev + 1);
                                                        playSuccessSound();
                                                    } else {
                                                        setFocusMode(false);
                                                    }
                                                }}
                                                className="h-20 flex-1 rounded-[2rem] gradient-primary text-2xl font-black gap-4"
                                            >
                                                {currentIndex === localItems.length - 1 ? 'إنهاء الجرد' : 'الصنف التالي'}
                                                <ChevronLeft className="h-8 w-8" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Scanner Footer */}
                        <div className="p-8 bg-muted/20 flex justify-center">
                            <div className="max-w-xl w-full relative">
                                <ScanBarcode className="absolute right-6 top-5 h-8 w-8 text-primary" />
                                <Input
                                    placeholder="امسح باركود لبدء العد..."
                                    className="h-18 rounded-3xl bg-background/50 border-0 pr-18 text-2xl font-black text-center"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function PhysicalInventoryDetailPage({ params }) {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 size={40} className="animate-spin text-primary" />
                <p className="font-black text-muted-foreground animate-pulse">جاري تحميل الجرد...</p>
            </div>
        }>
            <InternalPhysicalInventoryDetailPage params={params} />
        </Suspense>
    );
}

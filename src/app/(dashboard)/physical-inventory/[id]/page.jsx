'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Save, CheckCircle, AlertTriangle, Search } from 'lucide-react';
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

export default function PhysicalInventoryDetailPage({ params }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { id } = use(params);
    const [search, setSearch] = useState('');
    const [localItems, setLocalItems] = useState([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Fetch Count Data
    const { data: count, isLoading, error } = useQuery({
        queryKey: ['physical-inventory', id],
        queryFn: async () => {
            const res = await fetch(`/api/physical-inventory/${id}`);
            if (!res.ok) throw new Error('Failed to fetch count');
            const data = await res.json();
            return data.count;
        },
        enabled: !!id,
    });

    // Initialize local state when data loads
    useEffect(() => {
        if (count) {
            setLocalItems(count.items);
        }
    }, [count]);

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
            toast.success('تم حفظ التغييرات');
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
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            router.push('/physical-inventory');
        },
        onError: (err) => toast.error(err.message),
    });

    // Handle quantity change
    const handleQuantityChange = (productId, newQty) => {
        const qty = parseInt(newQty) || 0;
        setLocalItems(prev => prev.map(item => {
            if (item.productId._id === productId) {
                const diff = qty - item.systemQty;
                return {
                    ...item,
                    actualQty: qty,
                    difference: diff,
                    value: diff * (item.buyPrice || 0)
                };
            }
            return item;
        }));
        setHasUnsavedChanges(true);
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

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <div className="text-red-500 text-center p-20">خطأ: {error.message}</div>;

    const isCompleted = count.status === 'completed';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <Button variant="ghost" className="mb-2" onClick={() => router.push('/physical-inventory')}>
                        <ArrowRight className="ml-2 h-4 w-4" />
                        عودة للقائمة
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        جرد: {count.location === 'warehouse' ? 'المخزن الرئيسي' : count.location === 'shop' ? 'المحل' : 'شامل'}
                        <Badge variant={isCompleted ? "success" : "secondary"}>
                            {isCompleted ? 'مكتمل' : 'مسودة'}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground">
                        {format(new Date(count.date), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                    </p>
                </div>

                {!isCompleted && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => saveMutation.mutate(localItems)}
                            disabled={!hasUnsavedChanges || saveMutation.isPending}
                        >
                            <Save className="ml-2 h-4 w-4" />
                            حفظ مسودة
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={hasUnsavedChanges}>
                                    <CheckCircle className="ml-2 h-4 w-4" />
                                    اعتماد نهائي
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد من اعتماد الجرد؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        سيتم تحديث كميات المخزون واعتماد الفروقات وتسجيل قيود محاسبية للتسوية.
                                        لا يمكن التراجع عن هذا الإجراء.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => completeMutation.mutate()} className="bg-red-600 hover:bg-red-700">
                                        تأكيد واعتماد
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">عدد المواد</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">{localItems.length}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">مواد بها فروقات</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold text-orange-600">{discrepancies.count}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">صافي الفروقات (قيمة)</CardTitle></CardHeader>
                    <CardContent className={`text-2xl font-bold ${discrepancies.valueImpact < 0 ? 'text-red-600' : 'text-green-600'}`} dir="ltr">
                        {discrepancies.valueImpact.toLocaleString()}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">حالة الحفظ</CardTitle></CardHeader>
                    <CardContent>
                        {hasUnsavedChanges ?
                            <span className="text-yellow-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> تغييرات غير محفوظة</span> :
                            <span className="text-green-600 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> تم الحفظ</span>
                        }
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث عن منتج..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pr-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">المنتج</TableHead>
                                    <TableHead>الكمية بالنظام</TableHead>
                                    <TableHead className="w-[150px]">الكمية الفعلية</TableHead>
                                    <TableHead>الفرق</TableHead>
                                    <TableHead>قيمة الفرق</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.map((item) => (
                                    <TableRow key={item.productId._id} className={item.difference !== 0 ? 'bg-muted/30' : ''}>
                                        <TableCell>
                                            <div className="font-medium">{item.productName}</div>
                                            <div className="text-xs text-muted-foreground">{item.productCode}</div>
                                        </TableCell>
                                        <TableCell>{item.systemQty}</TableCell>
                                        <TableCell>
                                            {isCompleted ? (
                                                <span className="font-bold">{item.actualQty}</span>
                                            ) : (
                                                <Input
                                                    type="number"
                                                    value={item.actualQty}
                                                    onChange={(e) => handleQuantityChange(item.productId._id, e.target.value)}
                                                    className={`w-24 ${item.difference !== 0 ? 'border-orange-500 focus-visible:ring-orange-500' : ''}`}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell dir="ltr" className={`text-right font-medium ${item.difference < 0 ? 'text-red-600' : item.difference > 0 ? 'text-green-600' : ''}`}>
                                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                                        </TableCell>
                                        <TableCell dir="ltr" className="text-right">
                                            {item.value !== 0 && item.value.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

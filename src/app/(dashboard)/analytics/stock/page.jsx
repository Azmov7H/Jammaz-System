'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, PackageCheck, BarChart3 } from 'lucide-react';

export default function StockAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [metrics, setMetrics] = useState({ totalValue: 0, lowStockCount: 0, outOfStockCount: 0 });

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/products?limit=500');
                const data = await res.json();
                const prods = data.products || [];

                let value = 0;
                let low = 0;
                let out = 0;

                prods.forEach(p => {
                    value += (p.stockQty * p.buyPrice) || 0;
                    if (p.stockQty === 0) out++;
                    else if (p.stockQty <= p.minLevel) low++;
                });

                setProducts(prods);
                setMetrics({ totalValue: value, lowStockCount: low, outOfStockCount: out });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const lowStockItems = products.filter(p => p.stockQty <= p.minLevel || p.stockQty === 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">تحليل المخزون</h1>
                    <p className="text-sm text-muted-foreground">إحصائيات ورؤى شاملة</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">قيمة المخزون (بالتكلفة)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl font-bold text-primary">
                            {metrics.totalValue.toLocaleString()} ج.م
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">منتجات منخفضة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            {metrics.lowStockCount} <AlertTriangle size={20} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">نواقص (رصيد صفري)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-destructive">
                            {metrics.outOfStockCount} <PackageCheck size={20} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg md:text-xl flex items-center gap-2 text-destructive">
                        <AlertTriangle size={20} /> تنبيهات النواقص
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">المنتج</TableHead>
                                    <TableHead className="text-center">المتوفر</TableHead>
                                    <TableHead className="text-center">حد الطلب</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lowStockItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-green-600 dark:text-green-400 font-semibold">
                                            المخزون بوضع ممتاز ✓
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lowStockItems.slice(0, 10).map(p => (
                                        <TableRow key={p._id}>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell className="text-center font-bold">{p.stockQty}</TableCell>
                                            <TableCell className="text-center text-muted-foreground">{p.minLevel}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={p.stockQty === 0 ? 'destructive' : 'warning'}>
                                                    {p.stockQty === 0 ? 'نفذت الكمية' : 'منخفض'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

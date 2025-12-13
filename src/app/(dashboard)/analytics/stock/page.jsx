'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, PackageCheck } from 'lucide-react';

export default function StockAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [metrics, setMetrics] = useState({ totalValue: 0, lowStockCount: 0, outOfStockCount: 0 });

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/products?limit=500'); // Fetch ample products
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
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        load();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

    const lowStockItems = products.filter(p => p.stockQty <= p.minLevel || p.stockQty === 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1B3C73]">تحليل المخزون</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">قيمة المخزون (بالتكلفة)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{metrics.totalValue.toLocaleString()} ج.م</div>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-800">منتجات منخفضة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-900 flex items-center gap-2">
                            {metrics.lowStockCount} <AlertTriangle size={20} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">نواقص (رصيد صفري)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900 flex items-center gap-2">
                            {metrics.outOfStockCount} <PackageCheck size={20} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> تنبيهات النواقص</CardTitle>
                </CardHeader>
                <CardContent>
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
                            {lowStockItems.slice(0, 10).map(p => (
                                <TableRow key={p._id}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-center font-bold">{p.stockQty}</TableCell>
                                    <TableCell className="text-center text-slate-500">{p.minLevel}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.stockQty === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {p.stockQty === 0 ? 'نفذت الكمية' : 'منخفض'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {lowStockItems.length === 0 && (
                                <TableRow><TableCell colSpan={4} className="text-center text-green-600 font-bold py-8">المخزون بوضع ممتاز</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

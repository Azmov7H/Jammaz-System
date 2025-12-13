'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';

export default function SalesReportPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, dailySales: [] });

    useEffect(() => {
        // Fetch real data in production. For now, we simulate or fetch simple invoices aggregations.
        // Let's rely on invoices API for now, or create a specific aggregate endpoint.
        // For prototype speed, I'll fetch recent invoices and process client side.

        async function loadData() {
            try {
                const res = await fetch('/api/invoices?limit=100');
                const data = await res.json();
                const invoices = data.invoices || [];

                const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
                const totalOrders = invoices.length;

                // Group by Date for Chart
                const salesByDate = {};
                invoices.forEach(inv => {
                    const date = new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    salesByDate[date] = (salesByDate[date] || 0) + inv.total;
                });

                const chartData = Object.keys(salesByDate).map(date => ({
                    date,
                    revenue: salesByDate[date]
                })).reverse(); // Show oldest first (if fetched desc)

                setStats({ totalRevenue, totalOrders, dailySales: chartData.reverse() }); // Restore order if needed
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1B3C73]">تقارير المبيعات</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.totalRevenue.toLocaleString()} ج.م</div>
                        <p className="text-xs text-muted-foreground">+20.1% عن الشهر الماضي (تجريبي)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">عدد الطلبات</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">متوسط قيمة الفاتورة</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString() : 0} ج.م
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>حركة المبيعات (آخر 100 فاتورة)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dailySales}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="revenue" fill="#1B3C73" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

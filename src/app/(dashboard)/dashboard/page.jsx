'use client';

import { useEffect, useState } from 'react';
import {
    TrendingUp,
    Package,
    AlertTriangle,
    DollarSign,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingCart
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
    const [data, setData] = useState({
        stats: { products: 0, lowStock: 0, invoices: 0, sales: 0 },
        chartData: [],
        topSelling: [],
        recentInvoices: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (!res.ok) throw new Error('Failed to fetch stats');
                const result = await res.json();
                setData(result);
            } catch (e) {
                console.error("Dashboard fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل البيانات...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#1B3C73]">لوحة التحكم</h1>
                    <p className="text-slate-500 mt-1">نظرة شاملة على أداء المخزون والمبيعات</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/invoices/new">
                        <Button className="bg-[#1B3C73] hover:bg-[#152e59] text-white shadow-lg shadow-blue-900/20">
                            <ShoppingCart className="ml-2 h-4 w-4" /> فاتورة جديدة
                        </Button>
                    </Link>
                    <Button variant="outline" className="border-[#1B3C73] text-[#1B3C73] hover:bg-blue-50">
                        تصدير التقرير
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="إجمالي المبيعات"
                    value={data.stats.sales.toLocaleString()}
                    unit=" ج.م"
                    icon={DollarSign}
                    trend="شهري"
                    trendUp={true}
                    color="text-[#1B3C73]"
                    bgIcon="bg-blue-100"
                />
                <KPICard
                    title="الفواتير المصدرة"
                    value={data.stats.invoices}
                    unit=" فاتورة"
                    icon={TrendingUp}
                    trend="الكل"
                    trendUp={true}
                    color="text-purple-600"
                    bgIcon="bg-purple-100"
                />
                <KPICard
                    title="المنتجات بالمخزن"
                    value={data.stats.products}
                    unit=" صنف"
                    icon={Package}
                    trend="نشط"
                    trendUp={true}
                    color="text-[#E8C547]"
                    textColor="text-yellow-600"
                    bgIcon="bg-yellow-100"
                />
                <KPICard
                    title="تنبيهات المخزون"
                    value={data.stats.lowStock}
                    unit=" منتج"
                    icon={AlertTriangle}
                    trend="انتباه"
                    trendUp={false}
                    color="text-red-600"
                    bgIcon="bg-red-100"
                    isWarning={data.stats.lowStock > 0}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Sales Chart */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 pb-4">
                        <CardTitle className="text-xl font-bold text-[#1B3C73] flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            تحليل المبيعات (آخر 6 أشهر)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.chartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1B3C73" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#1B3C73" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#1B3C73" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Side Widgets */}
                <div className="space-y-8">
                    {/* Recent Invoices Widget (Replaces Low Stock for variety, or keep Low Stock?) Let's keep Low Stock logic if we had API for it, but for now showing recent invoices is useful */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
                            <CardTitle className="text-lg font-bold text-[#1B3C73] flex items-center justify-between">
                                <span className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> أحدث الفواتير</span>
                                <Link href="/invoices" className="text-xs bg-white px-2 py-1 rounded-md shadow-sm hover:shadow-md transition-all">عرض الكل</Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {data.recentInvoices.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-500">لا توجد فواتير حديثة</div>
                                ) : (
                                    data.recentInvoices.map((inv) => (
                                        <div key={inv._id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    #
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 text-sm">{inv.customer || 'عميل نقدي'}</h4>
                                                    <p className="text-xs text-slate-500">{new Date(inv.date).toLocaleDateString('ar-SA')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[#1B3C73]">{inv.total} ج.م</p>
                                                <p className="text-[10px] text-slate-400">#{inv.number}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Selling */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-[#1B3C73] border-b border-blue-900 pb-4">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-[#E8C547]" /> الأكثر مبيعاً
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {data.topSelling.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-500">لا توجد بيانات كافية</div>
                                ) : (
                                    data.topSelling.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[#E8C547] font-bold text-lg">#{i + 1}</span>
                                                <h4 className="font-semibold text-slate-700 text-sm">{item.name}</h4>
                                            </div>
                                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                {item.totalQty} مبيع
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, unit, icon: Icon, trend, trendUp, color, bgIcon, isWarning, textColor }) {
    return (
        <Card className={`border-none shadow-lg shadow-slate-200/50 rounded-2xl hover:-translate-y-1 transition-transform duration-300 ${isWarning ? 'ring-2 ring-red-100' : ''}`}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgIcon}`}>
                        <Icon size={24} className={color} />
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {trendUp ? <ArrowUpRight size={14} /> : <AlertTriangle size={14} />}
                            {trend}
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">{title}</p>
                    <h3 className={`text-2xl font-bold mt-1 ${textColor || 'text-slate-800'}`}>
                        {value}<span className="text-sm font-normal text-slate-400">{unit}</span>
                    </h3>
                </div>
            </CardContent>
        </Card>
    );
}

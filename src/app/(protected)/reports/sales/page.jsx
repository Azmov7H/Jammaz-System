'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Loader2, DollarSign, ShoppingBag, TrendingUp, FileText, CreditCard, Banknote } from 'lucide-react';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SalesReportPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        totalInvoices: 0,
        totalItems: 0,
        dailyBreakdown: []
    });

    useEffect(() => {
        async function loadData() {
            try {
                // Default last 30 days
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);

                const query = `startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
                const res = await fetch(`/api/reports/sales?${query}`);
                const data = await res.json();

                setStats(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const formatCurrency = (val) => Number(val || 0).toLocaleString() + ' ج.م';

    // Calculate aggregated cash/credit from breakdown
    const totalCash = stats.dailyBreakdown?.reduce((sum, day) => sum + (day.cashReceived || 0), 0) || 0;
    const totalCredit = stats.dailyBreakdown?.reduce((sum, day) => sum + (day.creditSales || 0), 0) || 0;

    // Prepare chart data
    const chartData = {
        labels: stats.dailyBreakdown.map(d =>
            new Date(d.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
        ).reverse(),
        datasets: [
            {
                label: 'المبيعات',
                data: stats.dailyBreakdown.map(d => d.totalRevenue).reverse(),
                backgroundColor: 'hsl(var(--primary))',
                borderRadius: 4,
            },
            {
                label: 'الأرباح',
                data: stats.dailyBreakdown.map(d => d.grossProfit).reverse(),
                backgroundColor: '#16a34a',
                borderRadius: 4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                rtl: true,
            },
            tooltip: {
                rtl: true,
                callbacks: {
                    label: function (context) {
                        return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                grid: {
                    color: 'hsl(var(--border))',
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">تقارير المبيعات</h1>
                    <p className="text-sm text-muted-foreground">تحليل الأداء المالي والأرباح</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {formatCurrency(stats.totalRevenue)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(stats.totalProfit)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            هامش الربح: {stats.totalRevenue ? Math.round((stats.totalProfit / stats.totalRevenue) * 100) : 0}%
                        </p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">عدد الفواتير</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            متوسط: {stats.totalInvoices ? Math.round(stats.totalRevenue / stats.totalInvoices) : 0} ج.م / فاتورة
                        </p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm bg-slate-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">التحصيل</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="flex items-center gap-1 text-muted-foreground"><DollarSign size={12} /> نقدي</span>
                                <span className="font-bold">{formatCurrency(totalCash)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="flex items-center gap-1 text-muted-foreground"><CreditCard size={12} /> آجل</span>
                                <span className="font-bold">{formatCurrency(totalCredit)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg md:text-xl">حركة المبيعات اليومية</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="h-[300px] md:h-[400px]">
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

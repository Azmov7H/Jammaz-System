'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
export default function CustomerProfitReportPage() {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const { data, isLoading } = useQuery({
        queryKey: ['customer-profit', dateRange],
        queryFn: async () => {
            const params = new URLSearchParams({
                startDate: dateRange.start,
                endDate: dateRange.end
            });
            const res = await fetch(`/api/reports/customer-profit?${params.toString()}`);
            return res.json();
        }
    });

    const report = data?.data?.report || [];

    const totalRevenue = report.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const totalProfit = report.reduce((acc, curr) => acc + curr.totalProfit, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">تقرير ربحية العملاء</h1>
                    <p className="text-muted-foreground mt-2">
                        تحليل الأرباح والمبيعات لكل عميل
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-[150px]"
                    />
                    <span>إلى</span>
                    <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-[150px]"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-900">إجمالي المبيعات (للفترة)</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold text-blue-700">{totalRevenue.toLocaleString()}</CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-900">إجمالي الأرباح</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold text-green-700">{totalProfit.toLocaleString()}</CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-purple-900">هامش الربح العام</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold text-purple-700">
                        {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>العميل</TableHead>
                                        <TableHead>عدد الفواتير</TableHead>
                                        <TableHead>إجمالي المبيعات</TableHead>
                                        <TableHead>إجمالي الربح</TableHead>
                                        <TableHead>نسبة الهامش</TableHead>
                                        <TableHead>مؤشر الأداء</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.map((item) => (
                                        <TableRow key={item._id}>
                                            <TableCell className="font-medium">{item.customerName}</TableCell>
                                            <TableCell>{item.invoiceCount}</TableCell>
                                            <TableCell>{item.totalRevenue.toLocaleString()}</TableCell>
                                            <TableCell className="text-green-600">{item.totalProfit.toLocaleString()}</TableCell>
                                            <TableCell>{item.profitMargin.toFixed(1)}%</TableCell>
                                            <TableCell>
                                                {item.profitMargin > 20 ? (
                                                    <Badge className="bg-green-500">مربح جداً</Badge>
                                                ) : item.profitMargin > 10 ? (
                                                    <Badge className="bg-blue-500">جيد</Badge>
                                                ) : (
                                                    <Badge variant="outline">عادي</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {report.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا توجد بيانات لهذه الفترة</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

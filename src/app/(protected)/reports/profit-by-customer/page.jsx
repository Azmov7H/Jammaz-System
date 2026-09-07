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
import { Loader2, TrendingUp, Download, RefreshCcw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReportService } from '@/services/reportService';
import { toLocalYmd, todayLocal } from '@/lib/dates';

export default function CustomerProfitReportPage() {
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        return {
            start: toLocalYmd(new Date(now.getFullYear(), now.getMonth(), 1)),
            end: todayLocal()
        };
    });

    const { data: report = [], isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ['customer-profit', dateRange],
        queryFn: ({ signal }) => ReportService.getCustomerProfit(dateRange.start, dateRange.end, { signal })
    });

    const totalRevenue = report.reduce((acc, curr) => acc + (Number(curr.totalRevenue) || 0), 0);
    const totalProfit = report.reduce((acc, curr) => acc + (Number(curr.totalProfit) || 0), 0);
    const totalInvoices = report.reduce((acc, curr) => acc + (Number(curr.invoiceCount) || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-3 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">تقرير ربحية العملاء</h1>
                    <p className="text-muted-foreground mt-2">
                        تحليل الأرباح والمبيعات لكل عميل
                    </p>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-[150px]"
                        aria-label="تاريخ البداية"
                    />
                    <span>إلى</span>
                    <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-[150px]"
                        aria-label="تاريخ النهاية"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        aria-label="تحديث التقرير"
                        title="تحديث التقرير"
                    >
                        <RefreshCcw className={isFetching ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-info/10 border-info/30">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-info">إجمالي المبيعات (للفترة)</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold text-info">{totalRevenue.toLocaleString()}</CardContent>
                </Card>
                <Card className="bg-success/10 border-success/30">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-success">إجمالي الأرباح</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold text-success">{totalProfit.toLocaleString()}</CardContent>
                </Card>
                <Card className="bg-warning/10 border-warning/30">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-warning">عدد الفواتير</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold text-warning">{totalInvoices.toLocaleString()}</CardContent>
                </Card>
                <Card className="bg-info/10 border-info/30">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-info">هامش الربح العام</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold text-info">
                        {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isError ? (
                        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-destructive" />
                            <div>
                                <h3 className="font-bold text-destructive text-lg">تعذر تحميل التقرير</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {error?.message || 'حدث خطأ أثناء جلب البيانات'}
                                </p>
                            </div>
                            <Button onClick={() => refetch()} variant="outline" className="gap-2">
                                <RefreshCcw className="h-4 w-4" /> إعادة المحاولة
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="animate-spin w-10 h-10 text-primary" />
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table aria-label="أرباح العملاء">
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
                                            <TableCell>{Number(item.totalRevenue || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-success">{Number(item.totalProfit || 0).toLocaleString()}</TableCell>
                                            <TableCell>{(Number(item.profitMargin) || 0).toFixed(1)}%</TableCell>
                                            <TableCell>
                                                {item.profitMargin > 20 ? (
                                                    <Badge className="bg-success">مربح جداً</Badge>
                                                ) : item.profitMargin > 10 ? (
                                                    <Badge className="bg-info/10">جيد</Badge>
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

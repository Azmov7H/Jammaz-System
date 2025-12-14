'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Loader2, DollarSign, CreditCard, TrendingUp, Calendar, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function DailySalesPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: dailySales, isLoading } = useQuery({
        queryKey: ['daily-sales', date],
        queryFn: async () => {
            const res = await fetch(`/api/daily-sales?date=${date}`);
            return res.json();
        }
    });

    const summary = dailySales?.revenue || {};
    const invoices = dailySales?.invoices || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">تقرير المبيعات اليومية</h1>
                    <p className="text-muted-foreground mt-2">
                        ملخص المبيعات، الأرباح، والتحصيلات ليوم {format(new Date(date), 'dd MMMM yyyy', { locale: ar })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-[180px]"
                    />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-900">إجمالي المبيعات</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">
                            {(summary.totalRevenue || 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-900">مبيعات نقدية</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700 flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            {(summary.cashReceived || 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-orange-900">مبيعات آجلة</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700 flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            {((summary.creditSales || (summary.totalRevenue - summary.cashReceived)) || 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-indigo-900">إجمالي الربح</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            {(summary.grossProfit || 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Invoices List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>فواتير اليوم</CardTitle>
                        <CardDescription>عدد الفواتير: {summary.invoiceCount || 0}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>رقم الفاتورة</TableHead>
                                            <TableHead>العميل</TableHead>
                                            <TableHead>النوع</TableHead>
                                            <TableHead>القيمة</TableHead>
                                            <TableHead>الربح</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد مبيعات لهذا اليوم</TableCell>
                                            </TableRow>
                                        ) : (
                                            invoices.map(invoice => (
                                                <TableRow key={invoice._id}>
                                                    <TableCell className="font-medium">{invoice.number}</TableCell>
                                                    <TableCell>{invoice.customerName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={invoice.paymentType === 'credit' ? 'outline' : 'secondary'}>
                                                            {invoice.paymentType === 'credit' ? 'آجل' : 'نقدي'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{invoice.total.toLocaleString()}</TableCell>
                                                    <TableCell className="text-green-600 font-bold">{invoice.profit?.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>الأكثر مبيعاً</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {summary.topProducts?.map((product, i) => (
                                <div key={i} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">{product.quantitySold} قطعة</div>
                                        </div>
                                    </div>
                                    <div className="font-bold">
                                        {product.revenue.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            {(!summary.topProducts || summary.topProducts.length === 0) && (
                                <div className="text-center text-muted-foreground py-4">لا توجد بيانات</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

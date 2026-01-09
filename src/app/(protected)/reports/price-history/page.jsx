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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function PriceHistoryPage() {
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['price-history'],
        queryFn: async () => {
            const res = await fetch('/api/reports/price-history?limit=100');
            return res.json();
        }
    });

    const history = data?.history || [];

    // Client-side filtering
    const filteredHistory = history.filter(item =>
        item.productId?.name.toLowerCase().includes(search.toLowerCase()) ||
        item.productId?.code.toLowerCase().includes(search.toLowerCase())
    );

    const getPriceTypeLabel = (type) => {
        const types = {
            'retail': 'قطاعي',
            'wholesale': 'جملة',
            'special': 'خاص',
            'buy': 'شراء'
        };
        return types[type] || type;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">سجل تغيرات الأسعار</h1>
                <p className="text-muted-foreground mt-2">
                    تتبع تاريخ تعديلات أسعار المنتجات (شراء وبيع)
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث باسم المنتج أو الكود..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pr-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>المنتج</TableHead>
                                        <TableHead>نوع السعر</TableHead>
                                        <TableHead>السعر القديم</TableHead>
                                        <TableHead>السعر الجديد</TableHead>
                                        <TableHead>التغيير</TableHead>
                                        <TableHead>بواسطة</TableHead>
                                        <TableHead>السبب</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                                لا توجد سجلات
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredHistory.map((item) => (
                                            <TableRow key={item._id}>
                                                <TableCell className="text-xs">
                                                    {format(new Date(item.date), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{item.productId?.name || 'منتج محذوف'}</div>
                                                    <div className="text-xs text-muted-foreground">{item.productId?.code}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{getPriceTypeLabel(item.priceType)}</Badge>
                                                </TableCell>
                                                <TableCell>{item.oldPrice?.toLocaleString()}</TableCell>
                                                <TableCell className="font-bold">{item.newPrice?.toLocaleString()}</TableCell>
                                                <TableCell dir="ltr" className="text-right">
                                                    {item.changeAmount > 0 ? (
                                                        <span className="text-green-600 flex items-center justify-end gap-1">
                                                            {item.changePercentage}% <ArrowUpRight className="h-3 w-3" />
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 flex items-center justify-end gap-1">
                                                            {item.changePercentage}% <ArrowDownRight className="h-3 w-3" />
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">{item.changedBy?.name || 'النظام'}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={item.changeReason}>
                                                    {item.changeReason || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function PhysicalInventoryPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');

    const fetchCounts = async () => {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (locationFilter !== 'all') params.append('location', locationFilter);

        const res = await fetch(`/api/physical-inventory?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch counts');
        return res.json();
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['physical-inventory', statusFilter, locationFilter],
        queryFn: fetchCounts,
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-500">مكتمل</Badge>;
            case 'draft':
                return <Badge variant="secondary">مسودة</Badge>;
            case 'cancelled':
                return <Badge variant="destructive">ملغي</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getLocationLabel = (location) => {
        switch (location) {
            case 'warehouse': return 'المخزن الرئيسي';
            case 'shop': return 'المحل';
            case 'both': return 'الكل (مخزن + محل)';
            default: return location;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">الجرد الفعلي</h1>
                    <p className="text-muted-foreground mt-2">
                        إدارة عمليات الجرد ومطابقة الكميات الفعلية مع النظام
                    </p>
                </div>
                <Button onClick={() => router.push('/physical-inventory/new')}>
                    <Plus className="ml-2 h-4 w-4" />
                    جرد جديد
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pr-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الحالات</SelectItem>
                                <SelectItem value="draft">مسودة</SelectItem>
                                <SelectItem value="completed">مكتمل</SelectItem>
                                <SelectItem value="cancelled">ملغي</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="الموقع" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المواقع</SelectItem>
                                <SelectItem value="warehouse">المخزن الرئيسي</SelectItem>
                                <SelectItem value="shop">المحل</SelectItem>
                                <SelectItem value="both">الكل</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 p-8">
                            حدث خطأ في تحميل البيانات
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>الموقع</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead>قام بالجرد</TableHead>
                                        <TableHead>الفروقات (عجز/زيادة)</TableHead>
                                        <TableHead>الأثر المالي</TableHead>
                                        <TableHead className="text-left">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.counts?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                                لا توجد عمليات جرد سابقة
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.counts?.map((count) => (
                                            <TableRow key={count._id}>
                                                <TableCell>
                                                    {format(new Date(count.date), 'dd MMMM yyyy', { locale: ar })}
                                                </TableCell>
                                                <TableCell>{getLocationLabel(count.location)}</TableCell>
                                                <TableCell>{getStatusBadge(count.status)}</TableCell>
                                                <TableCell>{count.createdBy?.name || 'غير معروف'}</TableCell>
                                                <TableCell className="dir-ltr text-right">
                                                    {count.netDifference > 0 ? (
                                                        <span className="text-green-600">+{count.netDifference} (زيادة)</span>
                                                    ) : count.netDifference < 0 ? (
                                                        <span className="text-red-600">{count.netDifference} (عجز)</span>
                                                    ) : (
                                                        <span className="text-gray-500">مطابق</span>
                                                    )}
                                                </TableCell>
                                                <TableCell dir="ltr" className="text-right font-medium">
                                                    {count.valueImpact?.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-left">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.push(`/physical-inventory/${count._id}`)}
                                                    >
                                                        <Eye className="h-4 w-4 ml-2" />
                                                        عرض التفاصيل
                                                    </Button>
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

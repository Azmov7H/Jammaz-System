'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Package, TrendingUp, TrendingDown, ArrowRightLeft, FileEdit } from 'lucide-react';

export default function StockMovementsPage() {
    const [days, setDays] = useState(7);
    const [searchProduct, setSearchProduct] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['stock-movements', days],
        queryFn: async () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const res = await fetch(
                `/api/stock/movements?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
            );
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        }
    });

    const movements = data?.movements || [];

    const filteredMovements = searchProduct
        ? movements.filter(m =>
            m.productId?.name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
            m.productId?.code?.toLowerCase().includes(searchProduct.toLowerCase())
        )
        : movements;

    const getMovementIcon = (type) => {
        switch (type) {
            case 'SALE': return <TrendingDown className="w-4 h-4 text-red-600" />;
            case 'IN': return <TrendingUp className="w-4 h-4 text-green-600" />;
            case 'TRANSFER_TO_SHOP':
            case 'TRANSFER_TO_WAREHOUSE':
                return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
            case 'ADJUST': return <FileEdit className="w-4 h-4 text-amber-600" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const getMovementLabel = (type) => {
        const labels = {
            'SALE': 'بيع',
            'IN': 'شراء',
            'OUT': 'خروج',
            'TRANSFER_TO_SHOP': 'تحويل للمحل',
            'TRANSFER_TO_WAREHOUSE': 'تحويل للمخزن',
            'ADJUST': 'تصحيح'
        };
        return labels[type] || type;
    };

    const getMovementVariant = (type) => {
        const variants = {
            'SALE': 'destructive',
            'IN': 'default',
            'OUT': 'destructive',
            'TRANSFER_TO_SHOP': 'secondary',
            'TRANSFER_TO_WAREHOUSE': 'secondary',
            'ADJUST': 'warning'
        };
        return variants[type] || 'outline';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <Package className="w-8 h-8" /> سجل حركة المخزون
                    </h1>
                    <p className="text-muted-foreground">جميع حركات الدخول والخروج والتحويلات</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={days === 7 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDays(7)}
                    >
                        7 أيام
                    </Button>
                    <Button
                        variant={days === 30 ? 'default' : 'outline'}
                        size="  sm"
                        onClick={() => setDays(30)}
                    >
                        30 يوم
                    </Button>
                    <Button
                        variant={days === 90 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDays(90)}
                    >
                        90 يوم
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div>
                <Input
                    placeholder="بحث بالمنتج..."
                    value={searchProduct}
                    onChange={e => setSearchProduct(e.target.value)}
                    className="max-w-md"
                />
            </div>

            {/* Movements List */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredMovements.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        لا توجد حركات مخزون
                    </CardContent>
                </Card>
            ) : (
                <Card className="border shadow-sm">
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {filteredMovements.map((movement) => (
                                <div key={movement._id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Product Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3">
                                                {getMovementIcon(movement.type)}
                                                <div>
                                                    <p className="font-bold">{movement.productId?.name || 'منتج محذوف'}</p>
                                                    <p className="text-sm text-muted-foreground font-mono">
                                                        {movement.productId?.code}
                                                    </p>
                                                    {movement.note && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {movement.note}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Movement Details */}
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold">{movement.qty}</p>
                                                <p className="text-xs text-muted-foreground">قطعة</p>
                                            </div>

                                            <Badge variant={getMovementVariant(movement.type)} className="gap-1">
                                                {getMovementLabel(movement.type)}
                                            </Badge>

                                            <div className="text-right min-w-[120px]">
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(movement.date).toLocaleDateString('ar-SA', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(movement.date).toLocaleTimeString('ar-SA', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Snapshot (if available) */}
                                        {movement.snapshot && (
                                            <div className="flex gap-3 text-xs">
                                                <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                                                    <p className="text-muted-foreground">مخزن</p>
                                                    <p className="font-bold">{movement.snapshot.warehouseQty}</p>
                                                </div>
                                                <div className="text-center p-2 bg-primary/5 rounded">
                                                    <p className="text-muted-foreground">محل</p>
                                                    <p className="font-bold">{movement.snapshot.shopQty}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

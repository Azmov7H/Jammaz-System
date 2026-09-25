'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Check, Store, Warehouse, Plus } from 'lucide-react';
import { cn } from '@/utils';

import { useProducts, useProductMetadata } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';

/**
 * Unified product picker (COMP-001). Single implementation serving
 * invoice items, stock movements and any other product-picking flow.
 *
 * Props:
 * - open / onOpenChange: controlled dialog state
 * - onSelect(product): selection callback
 * - multiple: keep the dialog open after selection (multi-add flows)
 * - showSearch: always show the "بحث بالاسم أو الكود" search bar
 *   (default true) — kept separate from showFilters so flows like the
 *   stock-transfer dialog (showFilters=false) still get search
 * - showFilters: category/brand filter selects above the table
 */
export function ProductSelector({
    open,
    onOpenChange,
    onSelect,
    multiple = false,
    showSearch = true,
    showFilters = true,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ category: 'all', brand: 'all' });
    const [page, setPage] = useState(1);

    const debouncedSearch = useDebounce(searchTerm, 500);

    const { data: productsData, isLoading: loading } = useProducts({
        page,
        limit: 10,
        search: debouncedSearch,
        category: filters.category,
        brand: filters.brand,
    }, { enabled: open });

    const { data: metadata = { brands: [], categories: [] } } = useProductMetadata();

    const products = productsData?.products || [];
    const totalPages = productsData?.pagination?.pages || 1;

    useEffect(() => {
        if (open) setPage(1);
    }, [debouncedSearch, filters, open]);

    const handleSelect = (product) => {
        onSelect(product);
        if (!multiple) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0" dir="rtl">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Package className="w-6 h-6 text-primary" />
                        اختيار منتجات
                    </DialogTitle>
                </DialogHeader>

                {showSearch && (
                    <div className="p-4 bg-muted/30">
                        <div className="relative">
                            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث بالاسم أو الكود..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-9"
                                data-testid="product-selector-search"
                            />
                        </div>
                    </div>
                )}

                {showFilters && (
                    <div className="px-4 pb-4 bg-muted/30 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-3">
                            <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="التصنيف" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل التصنيفات</SelectItem>
                                    {metadata.categories.map(c => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-3">
                            <Select value={filters.brand} onValueChange={(v) => setFilters({ ...filters, brand: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="العلامة التجارية" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل العلامات</SelectItem>
                                    {metadata.brands.map(b => (
                                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-auto p-4">
                    {loading ? (
                        <LoadingState />
                    ) : products.length === 0 ? (
                        <EmptyState
                            title="لا توجد منتجات تطابق بحثك"
                            hint="جرّب تعديل كلمات البحث أو الفلاتر"
                            className="py-20"
                        />
                    ) : (
                        <Table aria-label="نتائج البحث عن الأصناف">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">المنتج</TableHead>
                                    <TableHead className="text-center">السعر</TableHead>
                                    <TableHead className="text-center">المخزون المتوفر</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => {
                                    const shopQty = product.shopQty || 0;
                                    const warehouseQty = product.warehouseQty || 0;
                                    const price = product.sellPrice ?? product.retailPrice;

                                    return (
                                        <TableRow key={product._id} className="group">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground">{product.name}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{product.code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="font-bold text-primary">{price?.toLocaleString()} ج.م</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-center gap-1">
                                                    <Badge variant="outline" className="border-white/10">
                                                        كلي: {product.stockQty ?? shopQty + warehouseQty}
                                                    </Badge>
                                                    <div className="flex justify-center gap-2 text-xs">
                                                        <Badge variant="outline" className={cn(
                                                            "bg-success/10 text-success border-success/30 flex items-center gap-1",
                                                            shopQty <= 0 && "opacity-50 grayscale"
                                                        )}>
                                                            <Store className="w-3 h-3" />
                                                            {shopQty}
                                                        </Badge>
                                                        <Badge variant="outline" className={cn(
                                                            "bg-info/10 text-info border-info/30 flex items-center gap-1",
                                                            warehouseQty <= 0 && "opacity-50 grayscale"
                                                        )}>
                                                            <Warehouse className="w-3 h-3" />
                                                            {warehouseQty}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSelect(product)}
                                                    className="w-full"
                                                    variant="secondary"
                                                >
                                                    {multiple ? (
                                                        <>
                                                            <Plus className="w-4 h-4 ml-2" />
                                                            إضافة
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="w-4 h-4 ml-2" />
                                                            اختيار
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <div className="p-4 border-t bg-muted/10 flex justify-between items-center">
                    <Button
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        السابق
                    </Button>
                    <span className="text-sm font-medium">
                        صفحة {page} من {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        التالي
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

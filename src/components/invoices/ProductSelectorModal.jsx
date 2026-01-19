'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Package, Check, Store, Warehouse, Plus } from 'lucide-react';
import { cn } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProductSelectorModal({ open, onOpenChange, onSelect, defaultSource = 'shop' }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [metadata, setMetadata] = useState({ brands: [], categories: [] });
    const [filters, setFilters] = useState({ category: 'all', brand: 'all' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Initial load and metadata
    useEffect(() => {
        if (open) {
            fetchProducts();
            if (metadata.categories.length === 0) fetchMetadata();
        }
    }, [open, page, filters, searchTerm]);

    const fetchMetadata = async () => {
        try {
            const res = await fetch('/api/products/metadata');
            const json = await res.json();
            if (json.data) setMetadata(json.data);
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: searchTerm,
                category: filters.category,
                brand: filters.brand
            });
            const res = await fetch(`/api/products?${queryParams}`);
            const json = await res.json();
            if (json.data) {
                setProducts(json.data.products);
                setTotalPages(json.data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (product) => {
        onSelect(product);
        // Optional: Close modal after selection or keep open for multi-select?
        // Let's keep it open for now to allow adding multiple, maybe add a visual feedback
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

                {/* Filters & Search */}
                <div className="p-4 bg-muted/30 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث بالاسم أو الكود..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-9"
                        />
                    </div>
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

                {/* Products List */}
                <div className="flex-1 overflow-auto p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            لا توجد منتجات تطابق بحثك
                        </div>
                    ) : (
                        <Table>
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

                                    return (
                                        <TableRow key={product._id} className="group">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground">{product.name}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{product.code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="font-bold text-primary">{product.sellPrice} ج.م</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-3 text-xs">
                                                    <Badge variant="outline" className={cn(
                                                        "bg-emerald-500/10 text-emerald-600 border-emerald-200 flex items-center gap-1",
                                                        shopQty <= 0 && "opacity-50 grayscale"
                                                    )}>
                                                        <Store className="w-3 h-3" />
                                                        {shopQty}
                                                    </Badge>
                                                    <Badge variant="outline" className={cn(
                                                        "bg-blue-500/10 text-blue-600 border-blue-200 flex items-center gap-1",
                                                        warehouseQty <= 0 && "opacity-50 grayscale"
                                                    )}>
                                                        <Warehouse className="w-3 h-3" />
                                                        {warehouseQty}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSelect(product)}
                                                    className="w-full"
                                                    variant="secondary"
                                                >
                                                    <Plus className="w-4 h-4 ml-2" />
                                                    إضافة
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination */}
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

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Package, Loader2, Check } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import {
    Pagination, PaginationContent, PaginationItem,
    PaginationLink, PaginationNext, PaginationPrevious
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';

export function ProductSelectorDialog({ open, onOpenChange, onSelect }) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const debouncedSearch = useDebounce(search, 500);

    const { data: productsData, isLoading } = useProducts({
        search: debouncedSearch,
        page,
        limit: 10
    });

    const products = productsData?.products || [];
    const pagination = productsData?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };

    const handleSelect = (product) => {
        onSelect(product);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[80vh] flex flex-col p-0 overflow-hidden" dir="rtl">
                <DialogHeader className="px-6 py-4 border-b border-white/10 shrink-0">
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <Package className="text-primary" />
                        اختيار منتج
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                            placeholder="ابحث عن اسم المنتج أو الكود..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1); // Reset page on search
                            }}
                            className="h-12 pr-10 font-bold bg-secondary/50 border-0 ring-1 ring-white/10 focus:ring-primary/50"
                        />
                    </div>

                    {/* Results Table */}
                    <div className="border border-white/5 rounded-xl overflow-hidden min-h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                                    <TableHead className="text-right font-black">المنتج</TableHead>
                                    <TableHead className="text-center font-black">الكود</TableHead>
                                    <TableHead className="text-center font-black">المخزون</TableHead>
                                    <TableHead className="text-center font-black">السعر</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center text-muted-foreground font-bold">
                                            لا توجد نتائج
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow key={product._id} className="group hover:bg-primary/5 transition-colors">
                                            <TableCell className="font-bold">{product.name}</TableCell>
                                            <TableCell className="text-center font-mono text-sm">{product.code}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center text-xs font-bold gap-1">
                                                    <Badge variant="outline" className="border-white/10">
                                                        كلي: {product.stockQty}
                                                    </Badge>
                                                    <div className="flex gap-1 text-[10px] opacity-70">
                                                        <span>م: {product.warehouseQty || 0}</span>
                                                        <span>ح: {product.shopQty || 0}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-emerald-500">
                                                {product.retailPrice?.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSelect(product)}
                                                    className="font-bold gap-1"
                                                >
                                                    <Check size={16} />
                                                    اختيار
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center dir-ltr">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="flex items-center px-4 font-bold text-sm">
                                            صفحة {page} من {pagination.pages}
                                        </span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                            className={page === pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

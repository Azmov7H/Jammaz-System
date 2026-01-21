'use client';

import React from 'react';


import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Plus, Search, AlertTriangle, CheckCircle2,
    XCircle, FileEdit, Trash2, Eye, Loader2, Package, Layers,
    MoreVertical, Box, Barcode, Tag
} from 'lucide-react';
import {
    Pagination, PaginationContent, PaginationItem,
    PaginationLink, PaginationNext, PaginationPrevious
} from '@/components/ui/pagination';
import { useProductPage } from '@/hooks/useProductPage';
import { cn } from '@/utils';

// Dynamic Imports for Heavy Dialogs
const ProductFormDialog = dynamic(() => import('@/components/products/ProductFormDialog').then(mod => mod.ProductFormDialog), {
    loading: () => null,
    ssr: false
});

const ProductViewDialog = dynamic(() => import('@/components/products/ProductViewDialog').then(mod => mod.ProductViewDialog), {
    loading: () => null,
    ssr: false
});

export default function ProductsPage() {
    const {
        search, setSearch,
        filter, setFilter,
        page, setPage,
        pagination,
        isAddDialogOpen, setIsAddDialogOpen,
        isEditDialogOpen, setIsEditDialogOpen,
        isViewDialogOpen, setIsViewDialogOpen,
        selectedProduct,
        addFormData, setAddFormData,
        editFormData, setEditFormData,
        filteredProducts,
        stats,
        isLoading,
        metadata,
        canManage,
        addMutation,
        updateMutation,
        deleteMutation,
        handleEditClick,
        handleViewClick,
        handleAddSubmit,
        handleEditSubmit
    } = useProductPage();

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-1 md:p-6" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Package className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tight">المنتجات والمخزون</h1>
                            <p className="text-muted-foreground font-medium">إدارة الأصناف، الأسعار، وحركات المستودع</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-wrap gap-3 w-full lg:w-auto"
                >
                    {canManage && (
                        <Button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 border-0 flex-1 lg:flex-none gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            إضافة منتج جديد
                        </Button>
                    )}
                </motion.div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'إجمالي الأصناف', value: stats.total, icon: Layers, color: 'blue' },
                    { label: 'نواقص', value: stats.low, icon: AlertTriangle, color: 'amber' },
                    { label: 'نفذت', value: stats.out, icon: XCircle, color: 'red' },
                    { label: 'قيمة المخزون', value: stats.value.toLocaleString() + ' ج.م', icon: Box, color: 'emerald' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 hover:border-primary/20 transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                        </div>
                        <div className="mt-3 md:mt-4">
                            <p className="text-[10px] md:text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <h3 className="text-lg md:text-2xl font-black mt-1 truncate">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search & Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-2 md:p-4 rounded-3xl md:rounded-[2rem] border border-white/10 shadow-2xl flex flex-col md:flex-row gap-2 md:gap-4 items-center"
            >
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                        placeholder="بحث ذكي..."
                        className="h-12 md:h-14 pr-12 rounded-xl md:rounded-2xl bg-white/5 border-white/5 focus:bg-white/10 transition-all font-bold text-base md:text-lg"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-1 p-1 bg-white/5 rounded-xl md:rounded-2xl w-full md:w-auto">
                    {[
                        { id: 'all', label: 'الكل' },
                        { id: 'low', label: 'نواقص' },
                        { id: 'out', label: 'نفذت' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={cn(
                                "flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg md:rounded-xl font-bold transition-all text-xs md:text-sm whitespace-nowrap",
                                filter === tab.id
                                    ? "bg-primary text-primary-foreground shadow-lg"
                                    : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Products Table */}
            <div className="glass-card rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="md:table-header-group">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-right font-black py-6">المنتج</TableHead>
                                <TableHead className="text-right font-black hidden lg:table-cell">الماركة / الفئة</TableHead>
                                <TableHead className="text-center font-black">السعر</TableHead>
                                <TableHead className="text-center font-black hidden sm:table-cell">المخزون</TableHead>
                                <TableHead className="text-center font-black hidden md:table-cell">الحالة</TableHead>
                                <TableHead className="text-left font-black">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                            <p className="font-bold text-muted-foreground">جاري تحميل المنتجات...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <Package className="h-16 w-16" />
                                            <p className="font-black text-xl text-muted-foreground">لا توجد منتجات مطابقة للبحث</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredProducts.map((product) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={product._id}
                                            className="group border-white/5 hover:bg-white/5 transition-colors cursor-default"
                                        >
                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                                        <Barcode className="h-7 w-7 opacity-40" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-lg leading-tight">{product.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="font-mono text-[10px] tracking-wider border-white/10 uppercase py-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                                                                {product.code}
                                                            </Badge>
                                                            {product.unit && (
                                                                <span className="text-[10px] text-muted-foreground font-bold">({product.unit})</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm font-bold opacity-80">
                                                        <Tag className="h-3.5 w-3.5 text-primary" />
                                                        {product.brand || 'بدون ماركة'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                                        <Layers className="h-3 w-3" />
                                                        {product.category || '-'}
                                                        {product.subsection && ` / ${product.subsection}`}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-base md:text-lg font-black text-primary">{(product.retailPrice || product.sellPrice || 0).toLocaleString()}</span>
                                                    <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold leading-none">ج.م</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center hidden sm:table-cell">
                                                <div className="flex flex-col items-center">
                                                    <Badge className={cn(
                                                        "h-7 md:h-8 px-3 md:px-4 rounded-lg md:rounded-xl font-black text-xs md:text-sm transition-all shadow-lg",
                                                        product.stockQty === 0 ? "bg-red-500/20 text-red-500 border-red-500/50 shadow-red-500/10" :
                                                            product.stockQty <= (product.minLevel || 5) ? "bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-amber-500/10" :
                                                                "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 shadow-emerald-500/10"
                                                    )}>
                                                        {product.stockQty}
                                                    </Badge>
                                                    <div className="flex gap-2 mt-1.5 text-[9px] font-bold text-muted-foreground px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                                        <span>م: {product.warehouseQty || 0}</span>
                                                        <span className="opacity-20">|</span>
                                                        <span>ح: {product.shopQty || 0}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center hidden md:table-cell">
                                                {product.stockQty === 0 ? (
                                                    <Badge variant="destructive" className="h-6 px-3 rounded-lg font-black text-[10px] gap-1 shadow-md shadow-red-500/20">
                                                        <XCircle className="h-3 w-3" /> نفذت
                                                    </Badge>
                                                ) : product.stockQty <= (product.minLevel || 5) ? (
                                                    <Badge variant="secondary" className="h-6 px-3 rounded-lg font-black text-[10px] gap-1 bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-md shadow-amber-500/20">
                                                        <AlertTriangle className="h-3 w-3" /> منخفض
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="h-6 px-3 rounded-lg font-black text-[10px] gap-1 bg-emerald-500/20 text-emerald-500 border-emerald-500/50 shadow-md shadow-emerald-500/20">
                                                        <CheckCircle2 className="h-3 w-3" /> متوفر
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                                                            <MoreVertical className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 glass-card rounded-2xl border-white/10 p-2 shadow-2xl">
                                                        <DropdownMenuItem onClick={() => handleViewClick(product)} className="gap-3 p-3 rounded-xl cursor-pointer">
                                                            <Eye className="h-5 w-5 text-primary" />
                                                            <span className="font-bold">عرض التفاصيل</span>
                                                        </DropdownMenuItem>
                                                        {canManage && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleEditClick(product)} className="gap-3 p-3 rounded-xl cursor-pointer">
                                                                    <FileEdit className="h-5 w-5 text-amber-500" />
                                                                    <span className="font-bold text-amber-500">تعديل المنتج</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-white/5" />
                                                                <DropdownMenuItem
                                                                    onClick={() => deleteMutation.mutate(product._id)}
                                                                    className="gap-3 p-3 rounded-xl cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
                                                                    <span className="font-bold">حذف نهائي</span>
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </TableBody>
                    </Table>
                </div>
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

                            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === pagination.pages || Math.abs(page - p) <= 1)
                                .map((p, i, arr) => {
                                    const prev = arr[i - 1];
                                    return (
                                        <React.Fragment key={p}>
                                            {prev && p - prev > 1 && (
                                                <PaginationItem>
                                                    <span className="px-2">...</span>
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationLink
                                                    isActive={page === p}
                                                    onClick={() => setPage(p)}
                                                    className="cursor-pointer"
                                                >
                                                    {p}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </React.Fragment>
                                    );
                                })}

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


            {/* Dialogs */}
            {(isAddDialogOpen || isEditDialogOpen) && (
                <ProductFormDialog
                    open={isAddDialogOpen || isEditDialogOpen}
                    onOpenChange={
                        isAddDialogOpen
                            ? setIsAddDialogOpen
                            : (open) => { if (!open) setIsEditDialogOpen(false); }
                    }
                    mode={isAddDialogOpen ? 'add' : 'edit'}
                    formData={isAddDialogOpen ? addFormData : editFormData}
                    setFormData={isAddDialogOpen ? setAddFormData : setEditFormData}
                    onSubmit={isAddDialogOpen ? handleAddSubmit : handleEditSubmit}
                    isPending={isAddDialogOpen ? addMutation.isPending : updateMutation.isPending}
                    metadata={metadata}
                    productName={selectedProduct?.name}
                />
            )}

            {isViewDialogOpen && (
                <ProductViewDialog
                    open={isViewDialogOpen}
                    onOpenChange={setIsViewDialogOpen}
                    product={selectedProduct}
                />
            )}
        </div>
    );
}

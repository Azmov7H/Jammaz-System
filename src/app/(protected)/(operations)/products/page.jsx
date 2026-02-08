'use client';

import React, { useDeferredValue } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { cn } from '@/utils';
import {
    Plus,
    Search,
    Loader2,
    Package,
    Layers,
    RefreshCcw,
    XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import { useProductPage } from '@/hooks/useProductPage';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

// Standard Components
import { ProductRow } from '@/components/products/ProductRow';
import { ProductStatsCards } from '@/components/products/ProductStats';
import { PageHeader } from '@/components/ui/PageHeader';

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
        handleEditSubmit,
        refetch
    } = useProductPage();

    // Use deferred value for search to improve responsiveness
    const deferredSearch = useDeferredValue(search);

    const handleDelete = (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            {/* Header Section */}
            <PageHeader
                title="إدارة المنتجات"
                subtitle="تتبع المخزون والأسعار والحركات لحظياً"
                icon={Package}
                actions={
                    <>
                        <div className="hidden xl:flex items-center gap-6 glass-card px-8 py-4 rounded-3xl border border-white/10 shadow-xl ml-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">إجمالي الأصناف</span>
                                <span className="text-xl font-bold tabular-nums">{stats.total}</span>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="flex flex-col items-end text-emerald-500">
                                <span className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">القيمة الكلية</span>
                                <span className="text-xl font-bold tabular-nums">{(stats.value || 0).toLocaleString()} ج.م</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-1 lg:flex-none">
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-14 h-14 rounded-2xl glass-card border-white/10 hover:border-primary/50 transition-all shadow-lg"
                                onClick={() => refetch?.()}
                            >
                                <RefreshCcw className="w-6 h-6 text-muted-foreground group-hover:rotate-180 transition-transform duration-700" />
                            </Button>
                            {canManage && (
                                <Button
                                    onClick={() => setIsAddDialogOpen(true)}
                                    className="h-14 px-8 rounded-2xl font-black text-lg gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex-1 lg:flex-none bg-primary text-primary-foreground"
                                >
                                    <Plus size={24} />
                                    صنف جديد
                                </Button>
                            )}
                        </div>
                    </>
                }
            />

            {/* Quick Stats Grid */}
            {!isLoading && <ProductStatsCards stats={stats} />}

            {/* Interactive Control Bar */}
            <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between">
                <div className="relative group flex-1">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary h-6 w-6 group-focus-within:animate-pulse transition-all" />
                    <Input
                        placeholder="ابحث بعمق في قائمة الأصناف..."
                        className="h-16 pr-16 pl-8 rounded-[2rem] bg-card/40 border-white/10 focus:bg-card/60 focus:border-primary/50 transition-all font-black text-xl placeholder:text-muted-foreground/30 shadow-2xl backdrop-blur-xl ring-0 focus-visible:ring-0"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex p-2 bg-black/20 backdrop-blur-md rounded-[2rem] border border-white/5 shadow-inner">
                    {[
                        { id: 'all', label: 'كافة الأصناف', icon: Layers },
                        { id: 'low', label: 'نواقص المخزون', icon: RefreshCcw },
                        { id: 'out', label: 'أصناف نفذت', icon: XCircle }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={cn(
                                    "px-8 py-3 rounded-2xl font-black transition-all text-sm whitespace-nowrap flex items-center gap-3",
                                    filter === tab.id
                                        ? "bg-primary text-primary-foreground shadow-xl scale-105"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Products Table Container */}
            <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                        <h2 className="text-2xl font-black tracking-tight">قائمة المستودع</h2>
                    </div>
                    <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary font-black">
                        {pagination.total} صنف مطابقة
                    </Badge>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/5 h-16 bg-white/[0.01]">
                                <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8">المنتج والتفاصيل</TableHead>
                                <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8 hidden lg:table-cell">الماركة والفئة</TableHead>
                                <TableHead className="text-center font-black text-white/40 uppercase tracking-widest text-xs px-8">سعر البيع</TableHead>
                                <TableHead className="text-center font-black text-white/40 uppercase tracking-widest text-xs px-8 hidden sm:table-cell">المخزون الحالي</TableHead>
                                <TableHead className="text-center font-black text-white/40 uppercase tracking-widest text-xs px-8 hidden md:table-cell">حالة التوفر</TableHead>
                                <TableHead className="text-left font-black px-8 w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-96 text-center border-none">
                                        <LoadingState message="برجاء الانتظار، جاري المزامنة..." size="lg" />
                                    </TableCell>
                                </TableRow>
                            ) : deleteMutation.isError || addMutation.isError || updateMutation.isError ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-96 text-center border-none">
                                        <ErrorState onRetry={refetch} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-96 text-center border-none">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner group">
                                                <Package size={64} className="text-muted-foreground/20 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-2xl font-black text-white/30">لم يتم العثور على أي نتائج</p>
                                                <p className="text-sm text-white/10 font-bold uppercase tracking-widest">تأكد من كلمات البحث أو الفلاتر المختارة</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => (
                                    <ProductRow
                                        key={product._id}
                                        product={product}
                                        canManage={canManage}
                                        onView={handleViewClick}
                                        onEdit={handleEditClick}
                                        onDelete={handleDelete}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Elegant Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center pt-8" dir="ltr">
                    <div className="glass-card px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
                        <Pagination>
                            <PaginationContent className="gap-2">
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className={cn(
                                            "h-10 px-4 rounded-xl border-white/5 hover:bg-white/5 transition-all",
                                            page === 1 ? 'pointer-events-none opacity-25' : 'cursor-pointer'
                                        )}
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
                                                        <span className="px-3 text-muted-foreground/30 font-black">•••</span>
                                                    </PaginationItem>
                                                )}
                                                <PaginationItem>
                                                    <PaginationLink
                                                        isActive={page === p}
                                                        onClick={() => setPage(p)}
                                                        className={cn(
                                                            "h-10 w-10 text-base font-black rounded-xl transition-all cursor-pointer",
                                                            page === p
                                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                                : "border-white/5 hover:bg-white/5 text-muted-foreground"
                                                        )}
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
                                        className={cn(
                                            "h-10 px-4 rounded-xl border-white/5 hover:bg-white/5 transition-all text-sm",
                                            page === pagination.pages ? 'pointer-events-none opacity-25' : 'cursor-pointer'
                                        )}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
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

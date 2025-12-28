'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SmartCombobox } from '@/components/ui/smart-combobox';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Plus, Search, Filter, MoreVertical, AlertTriangle, CheckCircle2,
    XCircle, FileEdit, Trash2, Eye, Loader2, Package, Layers,
    ArrowUpRight, ArrowDownRight, History, Info, Tag, Barcode,
    Truck, Ruler, Palette, Users, Sun, Box, RefreshCw
} from 'lucide-react';
import { useProducts, useProductMetadata, useAddProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ProductsPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [addFormData, setAddFormData] = useState({
        name: '', code: '', sellPrice: '', buyPrice: '', minLevel: 5, brand: '', category: '',
        warehouseQty: '', shopQty: '', minProfitMargin: 0,
        subsection: '', season: '', unit: 'pcs'
    });

    const [editFormData, setEditFormData] = useState({});

    const { data: products = [], isLoading } = useProducts({ search });
    const { data: metadata = { brands: [], categories: [] } } = useProductMetadata();
    const addMutation = useAddProduct();
    const updateMutation = useUpdateProduct();
    const deleteMutation = useDeleteProduct();
    const { role } = useUserRole();

    const canManage = role === 'owner' || role === 'manager';

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (filter === 'low') return p.stockQty <= (p.minLevel || 5) && p.stockQty > 0;
            if (filter === 'out') return p.stockQty === 0;
            return true;
        });
    }, [products, filter]);

    const stats = useMemo(() => {
        return {
            total: products.length,
            low: products.filter(p => p.stockQty <= (p.minLevel || 5) && p.stockQty > 0).length,
            out: products.filter(p => p.stockQty === 0).length,
            value: products.reduce((acc, p) => acc + (p.stockQty * (p.buyPrice || 0)), 0)
        };
    }, [products]);

    const handleEditClick = (product) => {
        setSelectedProduct(product);
        setEditFormData({
            _id: product._id,
            name: product.name || '',
            code: product.code || '',
            sellPrice: product.retailPrice || product.sellPrice || '',
            buyPrice: product.buyPrice || '',
            minLevel: product.minLevel || 5,
            brand: product.brand || '',
            category: product.category || '',
            minProfitMargin: product.minProfitMargin || 0,
            subsection: product.subsection || '',
            season: product.season || '',
            unit: product.unit || 'pcs'
        });
        setIsEditDialogOpen(true);
    };

    const handleViewClick = (product) => {
        setSelectedProduct(product);
        setIsViewDialogOpen(true);
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        addMutation.mutate(addFormData, {
            onSuccess: () => {
                setIsAddDialogOpen(false);
                setAddFormData({
                    name: '', code: '', sellPrice: '', buyPrice: '', minLevel: 5, brand: '', category: '',
                    warehouseQty: '', shopQty: '', minProfitMargin: 0,
                    subsection: '', season: '', unit: 'pcs'
                });
            }
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        updateMutation.mutate(editFormData, {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
            }
        });
    };

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

            {/* Add/Edit Form Components and Dialogs */}
            <ProductFormDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                mode="add"
                formData={addFormData}
                setFormData={setAddFormData}
                onSubmit={handleAddSubmit}
                isPending={addMutation.isPending}
                metadata={metadata}
            />

            <ProductFormDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                mode="edit"
                formData={editFormData}
                setFormData={setEditFormData}
                onSubmit={handleEditSubmit}
                isPending={updateMutation.isPending}
                metadata={metadata}
                productName={selectedProduct?.name}
            />

            <ProductViewDialog
                open={isViewDialogOpen}
                onOpenChange={setIsViewDialogOpen}
                product={selectedProduct}
            />
        </div>
    );
}

// Helper to generate EAN-13 style barcode
const generateBarcode = () => {
    return Math.floor(Math.random() * 9000000000000) + 1000000000000; // 13 digits
};

function ProductFormDialog({ open, onOpenChange, mode, formData, setFormData, onSubmit, isPending, metadata, productName }) {
    // Auto-generate barcode on mount for new products
    useEffect(() => {
        if (open && mode === 'add' && !formData.code) {
            setFormData(prev => ({ ...prev, code: generateBarcode().toString() }));
        }
    }, [open, mode, setFormData, formData.code]);

    const handleRegenerateBarcode = () => {
        setFormData(prev => ({ ...prev, code: generateBarcode().toString() }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-[800px] h-[90vh] md:h-[80vh] overflow-y-auto glass-card border-white/10 p-0 rounded-3xl" dir="rtl">
                <form onSubmit={onSubmit}>
                    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black">
                                {mode === 'add' ? 'إضافة منتج جديد' : `تعديل: ${productName}`}
                            </DialogTitle>
                            <DialogDescription className="font-medium">
                                أدخل بيانات المنتج بدقة لضمان دقة التقارير المالية والمخزنية.
                            </DialogDescription>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Basic Info Section */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 font-black text-primary text-sm uppercase tracking-wider">
                                        <Info className="h-4 w-4" /> المعلومات الأساسية
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-sm mr-1">اسم المنتج *</Label>
                                            <Input
                                                required
                                                className="h-12 rounded-xl bg-white/5 border-white/5 font-bold"
                                                placeholder="اسم المنتج بالكامل..."
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-sm mr-1">كود المنتج (الباركود) *</Label>
                                            <div className="relative flex gap-2">
                                                <div className="relative flex-1">
                                                    <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                    <Input
                                                        required
                                                        className="h-12 pr-12 rounded-xl bg-white/5 border-white/5 font-mono font-bold"
                                                        placeholder="امسح أو اكتب الكود..."
                                                        value={formData.code}
                                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={handleRegenerateBarcode}
                                                    className="h-12 w-12 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors"
                                                    title="توليد كود تلقائي"
                                                >
                                                    <RefreshCw className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-sm mr-1">الماركة</Label>
                                            <SmartCombobox
                                                options={metadata.brands}
                                                value={formData.brand}
                                                onChange={(val) => setFormData({ ...formData, brand: val })}
                                                onCreate={(val) => setFormData({ ...formData, brand: val })}
                                                placeholder="اختر الماركة..."
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-sm mr-1">الفئة</Label>
                                            <SmartCombobox
                                                options={metadata.categories}
                                                value={formData.category}
                                                onChange={(val) => setFormData({ ...formData, category: val })}
                                                onCreate={(val) => setFormData({ ...formData, category: val })}
                                                placeholder="الفئة الرئيسية..."
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-sm mr-1">القسم الفرعي</Label>
                                            <Input
                                                className="h-12 rounded-xl bg-white/5 border-white/5"
                                                value={formData.subsection}
                                                onChange={e => setFormData({ ...formData, subsection: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-sm mr-1">الموسم</Label>
                                            <Input
                                                className="h-12 rounded-xl bg-white/5 border-white/5"
                                                value={formData.season}
                                                onChange={e => setFormData({ ...formData, season: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Inventory & Pricing Section */}
                            <div className="space-y-6">
                                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-6">
                                    <h3 className="flex items-center gap-2 font-black text-primary text-sm uppercase tracking-wider">
                                        <ArrowUpRight className="h-4 w-4" /> التسعير والمخزون
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-sm text-primary">سعر البيع (قطاعي) *</Label>
                                            <Input
                                                type="number"
                                                required
                                                className="h-14 rounded-2xl bg-white/10 border-primary/20 text-center font-black text-xl text-primary"
                                                value={formData.sellPrice}
                                                onChange={e => setFormData({ ...formData, sellPrice: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-sm opacity-80">سعر التكلفة</Label>
                                            <Input
                                                type="number"
                                                className="h-14 rounded-2xl bg-white/5 border-white/5 text-center font-bold text-lg"
                                                value={formData.buyPrice}
                                                onChange={e => setFormData({ ...formData, buyPrice: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold mr-1">هامش ربح أدنى (%)</Label>
                                            <Input
                                                type="number"
                                                className="h-11 rounded-xl bg-white/5 border-white/5 text-center"
                                                value={formData.minProfitMargin}
                                                onChange={e => setFormData({ ...formData, minProfitMargin: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold mr-1">حد الطلب (Minimum)</Label>
                                            <Input
                                                type="number"
                                                className="h-11 rounded-xl bg-white/5 border-white/5 text-center"
                                                value={formData.minLevel}
                                                onChange={e => setFormData({ ...formData, minLevel: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Handover Section - ONLY on Add Mode */}
                                {mode === 'add' && (
                                    <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 font-black text-emerald-500 text-sm uppercase tracking-wider">
                                                <History className="h-4 w-4" /> الرصيد الافتتاحي
                                            </h3>
                                            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[9px] font-black uppercase">التسجيل الأول</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold">الكمية بالمخزن</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    className="h-12 rounded-xl bg-white/5 border-emerald-500/20 text-center font-bold"
                                                    value={formData.warehouseQty}
                                                    onChange={e => setFormData({ ...formData, warehouseQty: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold">الكمية بالمحل</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    className="h-12 rounded-xl bg-white/5 border-emerald-500/20 text-center font-bold"
                                                    value={formData.shopQty}
                                                    onChange={e => setFormData({ ...formData, shopQty: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium bg-emerald-500/5 p-2 rounded-lg leading-relaxed">
                                            💡 هذه هي الكميات التي يتم تسجيلها لأول مرة عند استلام المحل للنظام. سيتم إنشاء حركة "رصيد افتتاحي" آلياً بهذه القيم.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 md:pt-8 border-t border-white/5">
                            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">النظام جاهز للتسجيل</span>
                            </div>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none h-12 px-8 rounded-2xl border-white/10 hover:bg-white/5 font-bold">
                                    إلغاء
                                </Button>
                                <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none h-12 px-12 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20">
                                    {isPending ? <Loader2 className="animate-spin" /> : (mode === 'add' ? 'إضافة المنتج' : 'حفظ التغييرات')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    );
}

function ProductViewDialog({ open, onOpenChange, product }) {
    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] glass-card border-white/10 p-0 rounded-[2.5rem]" dir="rtl">
                <div className="relative h-32 bg-primary/10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                    <div className="absolute -right-10 -top-10 h-40 w-40 bg-primary/20 blur-3xl rounded-full" />
                    <div className="absolute right-8 bottom-0 translate-y-1/2 p-4 bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl">
                        <Barcode className="h-12 w-12 text-primary" />
                    </div>
                </div>

                <div className="p-8 pt-12 space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black">{product.name}</h2>
                            <p className="font-mono text-muted-foreground mt-1 uppercase tracking-tighter">{product.code}</p>
                        </div>
                        <Badge className="h-10 px-6 rounded-2xl bg-primary/10 text-primary border-primary/20 font-black text-lg">
                            {product.retailPrice || product.sellPrice} ج.م
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'الماركة', val: product.brand, icon: Tag },
                            { label: 'الفئة', val: product.category, icon: Layers },
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase opacity-60 mb-1">
                                    <item.icon className="h-3 w-3" /> {item.label}
                                </div>
                                <p className="font-black text-sm">{item.val || '-'}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 space-y-4">
                            <h4 className="flex items-center gap-2 font-black text-emerald-500 text-xs uppercase tracking-widest">
                                <Box className="h-4 w-4" /> حالة المخزون الحالية
                            </h4>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-black">{product.stockQty}</p>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase">إجمالي الرصيد</p>
                                </div>
                                <div className="text-left font-bold text-xs space-y-1">
                                    <p className="opacity-60">المخزن: {product.warehouseQty || 0}</p>
                                    <p className="opacity-60">المحل: {product.shopQty || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
                            <h4 className="flex items-center gap-2 font-black text-primary text-xs uppercase tracking-widest">
                                <History className="h-4 w-4" /> الرصيد الافتتاحي
                            </h4>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-black">{(product.openingWarehouseQty || 0) + (product.openingShopQty || 0)}</p>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase">عند تسليم النظام</p>
                                </div>
                                <div className="text-left font-bold text-xs">
                                    <p className="opacity-60">التكلفة: {product.openingBuyPrice || product.buyPrice || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button className="flex-1 h-12 rounded-2xl font-black" onClick={() => onOpenChange(false)}>
                            إغلاق النافذة
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SmartCombobox } from '@/components/ui/smart-combobox';
import {
    Plus, Search, Filter, MoreVertical, AlertTriangle, CheckCircle2,
    XCircle, FileEdit, Trash2, Eye, Loader2
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useProducts, useProductMetadata, useAddProduct } from '@/hooks/useProducts';

export default function ProductsPage() {
    // Filters State
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    // Data Hooks
    const { data: products = [], isLoading } = useProducts({ search });
    const { data: metadata = { brands: [], categories: [] } } = useProductMetadata();
    const addMutation = useAddProduct();

    // UI State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', code: '', sellPrice: '', buyPrice: '', stockQty: '', minLevel: 10, brand: '', category: ''
    });

    // Client-side filtering for status (Simpler than API for now)
    const filteredProducts = products.filter(p => {
        if (filter === 'low') return p.stockQty <= (p.minLevel || 5) && p.stockQty > 0;
        if (filter === 'out') return p.stockQty === 0;
        return true;
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addMutation.mutate(formData, {
            onSuccess: () => {
                setIsDialogOpen(false);
                setFormData({ name: '', code: '', sellPrice: '', buyPrice: '', stockQty: '', minLevel: 10, brand: '', category: '' });
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1B3C73]">إدارة المنتجات</h1>
                    <p className="text-sm text-slate-500">قائمة المخزون والتحكم بالأصناف</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} className={filter === 'all' ? "bg-[#1B3C73]" : ""}>الكل</Button>
                    <Button variant={filter === 'low' ? 'default' : 'outline'} onClick={() => setFilter('low')} className={filter === 'low' ? "bg-yellow-500 hover:bg-yellow-600 text-white border-none" : "text-yellow-600 border-yellow-200 bg-yellow-50"}>نواقص</Button>
                    <Button variant={filter === 'out' ? 'default' : 'outline'} onClick={() => setFilter('out')} className={filter === 'out' ? "bg-red-500 hover:bg-red-600 text-white border-none" : "text-red-600 border-red-200 bg-red-50"}>نواقص حادة</Button>
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-[#1B3C73] gap-2"><Plus size={18} /> إضافة منتج</Button>
                </div>
            </div>

            <div className="flex gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <Input
                        placeholder="بحث باسم المنتج، الكود، او الماركة..."
                        className="pr-10 border-slate-200 focus:border-[#1B3C73]"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="gap-2"><Filter size={18} /> فلترة متقدمة</Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-right font-bold text-[#1B3C73]">كود</TableHead>
                            <TableHead className="text-right font-bold text-[#1B3C73]">الصنف</TableHead>
                            <TableHead className="text-right font-bold text-[#1B3C73]">الماركة</TableHead>
                            <TableHead className="text-right font-bold text-[#1B3C73]">السعر الأساسي</TableHead>
                            <TableHead className="text-center font-bold text-[#1B3C73]">المخزون</TableHead>
                            <TableHead className="text-center font-bold text-[#1B3C73]">الحالة</TableHead>
                            <TableHead className="text-left font-bold text-[#1B3C73]">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="h-40 text-center"><Loader2 className="animate-spin mx-auto text-[#1B3C73]" /></TableCell></TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-500">لا توجد منتجات مطابقة</TableCell></TableRow>
                        ) : (
                            filteredProducts.map((product) => {
                                const isLow = product.stockQty <= (product.minLevel || 5) && product.stockQty > 0;
                                const isOut = product.stockQty === 0;

                                return (
                                    <TableRow key={product._id} className={isOut ? 'bg-red-50/50' : isLow ? 'bg-yellow-50/50' : ''}>
                                        <TableCell className="font-mono text-xs font-bold text-slate-500">{product.code}</TableCell>
                                        <TableCell>
                                            <div className="font-bold text-slate-800">{product.name}</div>
                                            <div className="text-xs text-slate-400">{product.category}</div>
                                        </TableCell>
                                        <TableCell>{product.brand || '-'}</TableCell>
                                        <TableCell className="font-bold text-[#1B3C73]">{(product.sellPrice || 0).toLocaleString()} ج.م</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`px-3 py-1 rounded-lg font-bold text-sm ${isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {product.stockQty}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isOut ? <Badge variant="destructive" className="gap-1"><XCircle size={12} /> نفذت</Badge> : isLow ? <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 gap-1 hover:bg-yellow-200"><AlertTriangle size={12} /> منخفض</Badge> : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1"><CheckCircle2 size={12} /> متوفر</Badge>}
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="gap-2"><Eye size={16} /> التفاصيل</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2"><FileEdit size={16} /> تعديل</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-red-600 cursor-pointer"><Trash2 size={16} /> حذف</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Smart Add Product Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px]" dir="rtl">
                    <DialogHeader><DialogTitle>إضافة منتج جديد</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <Label>كود المنتج (الباركود)</Label>
                                <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="مسح الباركود..." className="font-mono bg-yellow-50 focus:bg-white transition-colors" autoFocus />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label>اسم المنتج</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="مثال: شنيور بوش" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>الماركة (Brand)</Label>
                                <SmartCombobox
                                    options={metadata.brands}
                                    value={formData.brand}
                                    onChange={(val) => setFormData({ ...formData, brand: val })}
                                    onCreate={(val) => setFormData({ ...formData, brand: val })}
                                    placeholder="اختر الماركة..."
                                />
                            </div>
                            <div>
                                <Label>الفئة (Category)</Label>
                                <SmartCombobox
                                    options={metadata.categories}
                                    value={formData.category}
                                    onChange={(val) => setFormData({ ...formData, category: val })}
                                    onCreate={(val) => setFormData({ ...formData, category: val })}
                                    placeholder="اختر الفئة..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
                            <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-slate-500">سعر البيع</Label>
                                <Input type="number" required value={formData.sellPrice} onChange={e => setFormData({ ...formData, sellPrice: e.target.value })} className="bg-white" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-slate-500">التكلفة</Label>
                                <Input type="number" value={formData.buyPrice} onChange={e => setFormData({ ...formData, buyPrice: e.target.value })} className="bg-white" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-slate-500">الرصيد</Label>
                                <Input type="number" required value={formData.stockQty} onChange={e => setFormData({ ...formData, stockQty: e.target.value })} className="bg-white" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-slate-500">حد الطلب</Label>
                                <Input type="number" value={formData.minLevel} onChange={e => setFormData({ ...formData, minLevel: e.target.value })} className="bg-white" placeholder="5" />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                            <Button type="submit" disabled={addMutation.isPending} className="bg-[#1B3C73] min-w-[120px]">
                                {addMutation.isPending ? 'جاري الحفظ...' : 'حفظ المنتج'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

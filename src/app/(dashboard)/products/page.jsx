'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
// افترض أن لديك خطافات (hooks) للتعديل والحذف
import { useProducts, useProductMetadata, useAddProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useUserRole } from '@/hooks/useUserRole';
// ملاحظة: تم افتراض وجود useUpdateProduct و useDeleteProduct

export default function ProductsPage() {
    // ------------------------------------
    // 1. حالات البحث والفلترة
    // ------------------------------------
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    // ------------------------------------
    // 2. حالات التحكم في النوافذ المنبثقة والمنتج المُختار
    // ------------------------------------
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false); // لإضافة منتج جديد
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // لتعديل منتج
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false); // لعرض تفاصيل المنتج

    // لتخزين بيانات المنتج المُختار للتعديل أو العرض
    const [selectedProduct, setSelectedProduct] = useState(null);

    // حالة نموذج الإضافة
    const [addFormData, setAddFormData] = useState({
        name: '', code: '', sellPrice: '', buyPrice: '', stockQty: '', minLevel: 10, brand: '', category: '',
        warehouseQty: '', shopQty: ''
    });

    // حالة نموذج التعديل (يتم تحديثها عند فتح نافذة التعديل)
    const [editFormData, setEditFormData] = useState({});

    // ------------------------------------
    // 3. خطافات (Hooks) جلب وتحديث البيانات
    // ------------------------------------
    const { data: products = [], isLoading } = useProducts({ search });
    const { data: metadata = { brands: [], categories: [] } } = useProductMetadata();
    const addMutation = useAddProduct();
    const updateMutation = useUpdateProduct(); // مفترض
    const deleteMutation = useDeleteProduct(); // مفترض

    // ------------------------------------
    // 4. وظائف التحكم (Handlers)
    // ------------------------------------

    // أ. وظيفة الفلترة من جهة العميل
    const filteredProducts = products.filter(p => {
        if (filter === 'low') return p.stockQty <= (p.minLevel || 5) && p.stockQty > 0;
        if (filter === 'out') return p.stockQty === 0;
        return true;
    });

    // ب. فتح نافذة التعديل وتجهيز البيانات
    const handleEditClick = (product) => {
        setSelectedProduct(product);
        // نستخدم بيانات المنتج الحالي لتهيئة نموذج التعديل
        setEditFormData({
            _id: product._id, // تأكد من إرسال الـ ID للتعديل
            name: product.name || '',
            code: product.code || '',
            sellPrice: product.sellPrice || '',
            buyPrice: product.buyPrice || '',
            stockQty: product.stockQty || '',
            minLevel: product.minLevel || 10,
            brand: product.brand || '',
            category: product.category || ''
        });
        setIsEditDialogOpen(true);
    };

    // ج. فتح نافذة التفاصيل
    const handleViewClick = (product) => {
        setSelectedProduct(product);
        setIsViewDialogOpen(true);
    };

    // د. إرسال نموذج الإضافة
    const handleAddSubmit = (e) => {
        e.preventDefault();
        addMutation.mutate(addFormData, {
            onSuccess: () => {
                setIsAddDialogOpen(false);
                setAddFormData({ name: '', code: '', sellPrice: '', buyPrice: '', stockQty: '', minLevel: 10, brand: '', category: '', warehouseQty: '', shopQty: '' });
            }
        });
    };

    // هـ. إرسال نموذج التعديل
    const handleEditSubmit = (e) => {
        e.preventDefault();
        // يتم استخدام updateMutation لإرسال البيانات المُعدّلة
        updateMutation.mutate(editFormData, {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
            }
        });
    };

    // ------------------------------------
    // 5. هيكل الصفحة (JSX)
    // ------------------------------------
    const { role } = useUserRole();
    const canManage = role === 'owner' || role === 'manager';
    const canWrite = role === 'owner' || role === 'manager' || role === 'warehouse';

    return (
        <div className="space-y-6">
            {/* Header and Filter Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1B3C73]">إدارة المنتجات</h1>
                    <p className="text-sm text-slate-500">قائمة المخزون والتحكم بالأصناف</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} className={filter === 'all' ? "bg-[#1B3C73]" : ""}>الكل</Button>
                    <Button variant={filter === 'low' ? 'default' : 'outline'} onClick={() => setFilter('low')} className={filter === 'low' ? "bg-yellow-500 hover:bg-yellow-600 text-white border-none" : "text-yellow-600 border-yellow-200 bg-yellow-50"}>نواقص</Button>
                    <Button variant={filter === 'out' ? 'default' : 'outline'} onClick={() => setFilter('out')} className={filter === 'out' ? "bg-red-500 hover:bg-red-600 text-white border-none" : "text-red-600 border-red-200 bg-red-50"}>نواقص حادة</Button>
                    {canManage && (
                        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#1B3C73] gap-2"><Plus size={18} /> إضافة منتج</Button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
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

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-right font-bold text-[#1B3C73]">كود</TableHead>
                            <TableHead className="text-right font-bold text-[#1B3C73]">الصنف</TableHead>
                            <TableHead className="text-right font-bold text-[#1B3C73]">الماركة</TableHead>
                            <TableHead className="text-right font-bold text-[#1B3C73]">السعر الأساسي</TableHead>
                            <TableHead className="text-center font-bold text-[#1B3C73]">المخزون الكلي</TableHead>
                            <TableHead className="text-center font-bold text-[#1B3C73]">توزيع (مخزن/محل)</TableHead>
                            <TableHead className="text-center font-bold text-[#1B3C73]">الحالة</TableHead>
                            <TableHead className="text-left font-bold text-[#1B3C73]">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={8} className="h-40 text-center"><Loader2 className="animate-spin mx-auto text-[#1B3C73]" /></TableCell></TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="h-40 text-center text-slate-500">لا توجد منتجات مطابقة</TableCell></TableRow>
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
                                        <TableCell className="text-center text-xs">
                                            <div>{product.warehouseQty || 0} (مخزن)</div>
                                            <div className="text-slate-400">|</div>
                                            <div>{product.shopQty || 0} (محل)</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isOut ? <Badge variant="destructive" className="gap-1"><XCircle size={12} /> نفذت</Badge> : isLow ? <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 gap-1 hover:bg-yellow-200"><AlertTriangle size={12} /> منخفض</Badge> : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1"><CheckCircle2 size={12} /> متوفر</Badge>}
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="gap-2" onClick={() => handleViewClick(product)}><Eye size={16} /> التفاصيل</DropdownMenuItem>
                                                    {canManage && (
                                                        <>
                                                            <DropdownMenuItem className="gap-2" onClick={() => handleEditClick(product)}><FileEdit size={16} /> تعديل</DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 text-red-600 cursor-pointer" onClick={() => { if (confirm('هل أنت متأكد من الحذف؟')) deleteMutation.mutate(product._id) }}><Trash2 size={16} /> حذف</DropdownMenuItem>
                                                        </>
                                                    )}
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

            {/* ------------------------------------
            6. نافذة إضافة منتج جديد (Add Dialog)
            ------------------------------------ */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[700px]" dir="rtl">
                    <DialogHeader><DialogTitle>إضافة منتج جديد</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddSubmit} className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <Label>كود المنتج (الباركود)</Label>
                                <Input value={addFormData.code} onChange={e => setAddFormData({ ...addFormData, code: e.target.value })} placeholder="مسح الباركود..." className="font-mono bg-yellow-50 focus:bg-white transition-colors" autoFocus />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label>اسم المنتج</Label>
                                <Input value={addFormData.name} onChange={e => setAddFormData({ ...addFormData, name: e.target.value })} placeholder="مثال: شنيور بوش" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>الماركة (Brand)</Label>
                                <SmartCombobox
                                    options={metadata.brands}
                                    value={addFormData.brand}
                                    onChange={(val) => setAddFormData({ ...addFormData, brand: val })}
                                    onCreate={(val) => setAddFormData({ ...addFormData, brand: val })}
                                    placeholder="اختر الماركة..."
                                />
                            </div>
                            <div>
                                <Label>الفئة (Category)</Label>
                                <SmartCombobox
                                    options={metadata.categories}
                                    value={addFormData.category}
                                    onChange={(val) => setAddFormData({ ...addFormData, category: val })}
                                    onCreate={(val) => setAddFormData({ ...addFormData, category: val })}
                                    placeholder="اختر الفئة..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
                            <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-slate-500">سعر البيع</Label>
                                <Input type="number" required value={addFormData.sellPrice} onChange={e => setAddFormData({ ...addFormData, sellPrice: e.target.value })} className="bg-white" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-slate-500">التكلفة (شراء)</Label>
                                <Input type="number" value={addFormData.buyPrice} onChange={e => setAddFormData({ ...addFormData, buyPrice: e.target.value })} className="bg-white" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-slate-500">كمية المخزن</Label>
                                <Input type="number" value={addFormData.warehouseQty} onChange={e => setAddFormData({ ...addFormData, warehouseQty: e.target.value })} className="bg-white" placeholder="0" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-slate-500">كمية المحل</Label>
                                <Input type="number" value={addFormData.shopQty} onChange={e => setAddFormData({ ...addFormData, shopQty: e.target.value })} className="bg-white" placeholder="0" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-slate-500">حد الطلب</Label>
                                <Input type="number" value={addFormData.minLevel} onChange={e => setAddFormData({ ...addFormData, minLevel: e.target.value })} className="bg-white" placeholder="5" />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
                            <Button type="submit" disabled={addMutation.isPending} className="bg-[#1B3C73] min-w-[120px]">
                                {addMutation.isPending ? 'جاري الحفظ...' : 'حفظ المنتج'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ------------------------------------
            7. نافذة تعديل المنتج (Edit Dialog)
            ------------------------------------ */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[700px]" dir="rtl">
                    <DialogHeader><DialogTitle>تعديل المنتج: {selectedProduct?.name}</DialogTitle></DialogHeader>
                    {/* يتم عرض النموذج فقط إذا كان هناك منتج مُختار */}
                    {selectedProduct && (
                        <form onSubmit={handleEditSubmit} className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <Label>كود المنتج (الباركود)</Label>
                                    <Input
                                        value={editFormData.code}
                                        onChange={e => setEditFormData({ ...editFormData, code: e.target.value })}
                                        placeholder="كود المنتج"
                                        className="font-mono bg-yellow-50 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <Label>اسم المنتج</Label>
                                    <Input
                                        value={editFormData.name}
                                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>الماركة (Brand)</Label>
                                    <SmartCombobox
                                        options={metadata.brands}
                                        value={editFormData.brand}
                                        onChange={(val) => setEditFormData({ ...editFormData, brand: val })}
                                        onCreate={(val) => setEditFormData({ ...editFormData, brand: val })}
                                        placeholder="اختر الماركة..."
                                    />
                                </div>
                                <div>
                                    <Label>الفئة (Category)</Label>
                                    <SmartCombobox
                                        options={metadata.categories}
                                        value={editFormData.category}
                                        onChange={(val) => setEditFormData({ ...editFormData, category: val })}
                                        onCreate={(val) => setEditFormData({ ...editFormData, category: val })}
                                        placeholder="اختر الفئة..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
                                <div className="col-span-2 md:col-span-1">
                                    <Label className="text-xs text-slate-500">سعر البيع</Label>
                                    <Input type="number" required value={editFormData.sellPrice} onChange={e => setEditFormData({ ...editFormData, sellPrice: e.target.value })} className="bg-white" />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <Label className="text-xs text-slate-500">التكلفة</Label>
                                    <Input type="number" value={editFormData.buyPrice} onChange={e => setEditFormData({ ...editFormData, buyPrice: e.target.value })} className="bg-white" />
                                </div>
                                <div className="col-span-4 p-2 bg-yellow-50/50 rounded text-xs text-slate-500 text-center">
                                    لتعديل الكميات، يرجى استخدام "إدارة المخزون" لضمان دقة السجلات. هنا يمكنك تعديل البيانات الأساسية فقط.
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <Label className="text-xs text-slate-500">حد الطلب</Label>
                                    <Input type="number" value={editFormData.minLevel} onChange={e => setEditFormData({ ...editFormData, minLevel: e.target.value })} className="bg-white" placeholder="5" />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>إلغاء</Button>
                                <Button type="submit" disabled={updateMutation.isPending} className="bg-green-600 hover:bg-green-700 min-w-[120px]">
                                    {updateMutation.isPending ? 'جاري التحديث...' : 'حفظ التعديلات'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* ------------------------------------
            8. نافذة عرض التفاصيل (View Dialog)
            ------------------------------------ */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                    <DialogHeader><DialogTitle>تفاصيل المنتج: {selectedProduct?.name}</DialogTitle></DialogHeader>
                    {selectedProduct && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                <p className="text-slate-500 text-right">الكود:</p>
                                <p className="font-mono font-bold text-slate-800 text-left">{selectedProduct.code || 'لا يوجد'}</p>

                                <p className="text-slate-500 text-right">الماركة:</p>
                                <p className="font-medium text-slate-800 text-left">{selectedProduct.brand || 'غير محدد'}</p>

                                <p className="text-slate-500 text-right">الفئة:</p>
                                <p className="font-medium text-slate-800 text-left">{selectedProduct.category || 'عام'}</p>

                                <p className="text-slate-500 text-right">سعر البيع:</p>
                                <p className="font-bold text-[#1B3C73] text-left">{(selectedProduct.sellPrice || 0).toLocaleString()} ج.م</p>

                                <p className="text-slate-500 text-right">التكلفة (الشراء):</p>
                                <p className="font-medium text-slate-600 text-left">{(selectedProduct.buyPrice || 0).toLocaleString()} ج.م</p>

                                <hr className="col-span-2 my-1 border-slate-200" />

                                <p className="text-slate-500 text-right">المخزون الكلي:</p>
                                <p className="font-bold text-blue-700 text-left">{selectedProduct.stockQty}</p>

                                <p className="text-slate-500 text-right">توزيع المخزون:</p>
                                <p className="text-slate-800 text-left font-mono text-xs">{selectedProduct.warehouseQty || 0} (م) | {selectedProduct.shopQty || 0} (ح)</p>

                                <p className="text-slate-500 text-right">حد إعادة الطلب:</p>
                                <p className="font-medium text-slate-600 text-left">{selectedProduct.minLevel || 5}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>إغلاق</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
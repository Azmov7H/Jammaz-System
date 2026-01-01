'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SmartCombobox } from '@/components/ui/smart-combobox';
import { Badge } from '@/components/ui/badge';
import { Info, RefreshCw, ArrowUpRight, History, Barcode } from 'lucide-react';
import { Loader2 } from 'lucide-react';

// Helper to generate EAN-13 style barcode
const generateBarcode = () => {
    return Math.floor(Math.random() * 9000000000000) + 1000000000000; // 13 digits
};

export function ProductFormDialog({ open, onOpenChange, mode, formData, setFormData, onSubmit, isPending, metadata, productName }) {
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

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Package, Barcode, RefreshCw, Loader2 } from 'lucide-react';
import { useAddProduct } from '@/hooks/useProducts';

// Helper to generate EAN-13 style barcode
const generateBarcode = () => {
    return Math.floor(Math.random() * 9000000000000) + 1000000000000; // 13 digits
};

export function QuickAddProductDialog({ open, onOpenChange, initialName = '', onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        retailPrice: '',
        buyPrice: ''
    });

    const addProductMutation = useAddProduct();

    // Initialize form when dialog opens
    useEffect(() => {
        if (open) {
            setFormData({
                name: initialName,
                code: generateBarcode().toString(),
                retailPrice: '',
                buyPrice: ''
            });
        }
    }, [open, initialName]);

    const handleRegenerateBarcode = () => {
        setFormData(prev => ({ ...prev, code: generateBarcode().toString() }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.code || !formData.retailPrice) return;

        addProductMutation.mutate({
            name: formData.name,
            code: formData.code,
            retailPrice: Number(formData.retailPrice),
            buyPrice: formData.buyPrice ? Number(formData.buyPrice) : 0,
            warehouseQty: 0,
            shopQty: 0
        }, {
            onSuccess: (response) => {
                const newProduct = response.data;
                onSuccess?.(newProduct);
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] glass-card border-white/10 rounded-3xl top-[60%]" dir="rtl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="pb-4">
                        <DialogTitle className="text-xl font-black flex items-center gap-2">
                            <Package className="text-primary" />
                            إضافة منتج سريعة
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            أدخل البيانات الأساسية للمنتج الجديد
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">اسم المنتج *</Label>
                            <Input
                                required
                                className="h-12 rounded-xl bg-white/5 border-white/10 font-bold"
                                placeholder="اسم المنتج..."
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Barcode */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">كود المنتج (الباركود) *</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        required
                                        className="h-12 pr-10 rounded-xl bg-white/5 border-white/10 font-mono font-bold"
                                        placeholder="الكود..."
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRegenerateBarcode}
                                    className="h-12 w-12 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary"
                                    title="توليد كود تلقائي"
                                >
                                    <RefreshCw className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-sm text-primary">سعر البيع *</Label>
                                <Input
                                    type="number"
                                    required
                                    className="h-12 rounded-xl bg-primary/10 border-primary/20 text-center font-black text-lg text-primary"
                                    placeholder="0"
                                    value={formData.retailPrice}
                                    onChange={e => setFormData({ ...formData, retailPrice: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-sm opacity-80">سعر التكلفة</Label>
                                <Input
                                    type="number"
                                    className="h-12 rounded-xl bg-white/5 border-white/10 text-center font-bold text-lg"
                                    placeholder="0"
                                    value={formData.buyPrice}
                                    onChange={e => setFormData({ ...formData, buyPrice: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-4 border-t border-white/5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-11 px-6 rounded-xl border-white/10"
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={addProductMutation.isPending || !formData.name || !formData.retailPrice}
                            className="h-11 px-8 rounded-xl bg-primary font-bold"
                        >
                            {addProductMutation.isPending ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                'إضافة المنتج'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

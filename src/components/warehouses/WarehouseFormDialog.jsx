'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Warehouse, Loader2, MapPin, Hash } from 'lucide-react';

/**
 * Create / edit an additional warehouse (WH-FE).
 * The primary warehouse is seeded by the backend and cannot be edited here —
 * its form is read-only apart from the address (handled by the page).
 */
export function WarehouseFormDialog({ open, onOpenChange, mode = 'add', initialData, onSubmit, isPending }) {
    const [formData, setFormData] = useState({ name: '', code: '', address: '', isActive: true });

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                name: initialData.name || '',
                code: initialData.code || '',
                address: initialData.address || '',
                isActive: initialData.isActive !== undefined ? initialData.isActive : true
            });
        } else if (mode === 'add' && open) {
            setFormData({ name: '', code: '', address: '', isActive: true });
        }
    }, [mode, initialData, open]);

    const isPrimary = mode === 'edit' && !!initialData?.isPrimary;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            name: formData.name.trim(),
            code: formData.code.trim(),
            address: formData.address.trim() || undefined,
            ...(isPrimary ? {} : { isActive: formData.isActive })
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] border-white/5 bg-card/95 backdrop-blur-3xl shadow-2xl rounded-[1.5rem]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        <Warehouse className="text-primary w-6 h-6" />
                        {mode === 'edit' ? 'تعديل بيانات المخزن' : 'إضافة مخزن جديد'}
                    </DialogTitle>
                    <DialogDescription>
                        {isPrimary
                            ? 'المخزن الرئيسي نظامي ولا يمكن حذفه أو تعطيله. يمكنك تعديل اسمه وكوده وعنوانه.'
                            : 'المخازن الإضافية تُدار بالكامل: يمكن تعديلها وتعطيلها وحذفها.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold mr-1 flex items-center gap-2">
                            <Warehouse size={12} /> اسم المخزن *
                        </Label>
                        <Input
                            required
                            data-testid="warehouse-name-input"
                            className="h-12 rounded-xl bg-muted/30 border-white/10"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="مثال: مخزن الفرع الرئيسي"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold mr-1 flex items-center gap-2">
                            <Hash size={12} /> كود المخزن *
                        </Label>
                        <Input
                            required
                            data-testid="warehouse-code-input"
                            className="h-12 rounded-xl bg-muted/30 border-white/10 font-mono"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            placeholder="مثال: WH-02"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold mr-1 flex items-center gap-2">
                            <MapPin size={12} /> العنوان
                        </Label>
                        <Input
                            className="h-12 rounded-xl bg-muted/30 border-white/10"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder="العنوان أو الموقع (اختياري)"
                        />
                    </div>

                    {!isPrimary && (
                        <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/10">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">المخزن نشط</Label>
                                <p className="text-xs text-muted-foreground">المخازن المعطلة لا تظهر كمقصد للمخزون</p>
                            </div>
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={checked => setFormData({ ...formData, isActive: checked })}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl px-6"
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl px-8 font-bold gradient-primary shadow-colored border-0 hover:scale-105 active:scale-95 transition-all"
                        >
                            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            حفظ المخزن
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

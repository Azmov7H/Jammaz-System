'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Loader2, Truck } from 'lucide-react';

export function CustomerFormDialog({ open, onOpenChange, mode = 'add', initialData, onSubmit, isPending }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        priceType: 'retail',
        address: '',
        creditLimit: '',
        notes: '',
        financialTrackingEnabled: true,
        collectionDay: 'None',
        paymentTerms: 0,
        openingBalance: '',
        openingBalanceType: 'debit',
        shippingCompany: ''
    });

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                priceType: initialData.priceType || 'retail',
                address: initialData.address || '',
                creditLimit: initialData.creditLimit || '',
                notes: initialData.notes || '',
                financialTrackingEnabled: initialData.financialTrackingEnabled !== undefined ? initialData.financialTrackingEnabled : true,
                collectionDay: initialData.collectionDay || 'None',
                paymentTerms: initialData.paymentTerms || 0,
                shippingCompany: initialData.shippingCompany || ''
            });
        } else if (mode === 'add' && open) {
            // Reset on fresh open
            setFormData({
                name: '',
                phone: '',
                priceType: 'retail',
                address: '',
                creditLimit: '',
                notes: '',
                financialTrackingEnabled: true,
                collectionDay: 'None',
                paymentTerms: 0,
                openingBalance: '',
                openingBalanceType: 'debit',
                shippingCompany: ''
            });
        }
    }, [mode, initialData, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>اسم العميل *</Label>
                            <Input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رقم الهاتف *</Label>
                            <Input
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>نوع التسعير</Label>
                            <Select
                                value={formData.priceType}
                                onValueChange={val => setFormData({ ...formData, priceType: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="retail">قطاعي (عادي)</SelectItem>
                                    <SelectItem value="wholesale">جملة</SelectItem>
                                    <SelectItem value="special">خاص</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>حد الائتمان (الديون) <span className="text-[10px] text-primary">(0 = مفتوح)</span></Label>
                            <Input
                                type="number"
                                value={formData.creditLimit}
                                onChange={e => setFormData({ ...formData, creditLimit: e.target.value })}
                                placeholder="أدخل الحد الأقصى للديون (0 للمفتوح)"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>العنوان</Label>
                        <Input
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>ملاحظات</Label>
                        <Input
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-primary" />
                            شركة الشحن (اختياري)
                        </Label>
                        <Input
                            value={formData.shippingCompany}
                            onChange={e => setFormData({ ...formData, shippingCompany: e.target.value })}
                            placeholder="اسم شركة الشحن المفضلة..."
                        />
                    </div>

                    <Separator />
                    <div className="bg-primary/5 p-4 rounded-xl space-y-4 border border-primary/10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                            <Wallet size={14} /> التحكم في المديونية والتحصيل
                        </h4>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm">تفعيل التتبع المالي</Label>
                                <p className="text-[10px] text-muted-foreground">توليد إشعارات تحصيل لهذا العميل</p>
                            </div>
                            <Switch
                                checked={formData.financialTrackingEnabled}
                                onCheckedChange={checked => setFormData({ ...formData, financialTrackingEnabled: checked })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">يوم التحصيل المفضل</Label>
                                <Select
                                    value={formData.collectionDay}
                                    onValueChange={val => setFormData({ ...formData, collectionDay: val })}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="None">غير محدد</SelectItem>
                                        <SelectItem value="Saturday">السبت</SelectItem>
                                        <SelectItem value="Sunday">الأحد</SelectItem>
                                        <SelectItem value="Monday">الاثنين</SelectItem>
                                        <SelectItem value="Tuesday">الثلاثاء</SelectItem>
                                        <SelectItem value="Wednesday">الأربعاء</SelectItem>
                                        <SelectItem value="Thursday">الخميس</SelectItem>
                                        <SelectItem value="Friday">الجمعة</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">فترة السداد الخاصة (يوم)</Label>
                                <Input
                                    type="number"
                                    className="h-9 text-xs"
                                    value={formData.paymentTerms}
                                    onChange={e => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 0 })}
                                    placeholder="0 = الافتراضي"
                                />
                            </div>
                        </div>
                    </div>

                    {mode === 'add' && (
                        <div className="bg-muted p-4 rounded-xl border border-border space-y-4">
                            <Label className="text-xs font-bold text-primary">الرصيد الافتتاحي (ديون سابقة)</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold">المبلغ</Label>
                                    <Input
                                        type="number"
                                        className="h-10 text-sm"
                                        placeholder="0.00"
                                        value={formData.openingBalance}
                                        onChange={e => setFormData({ ...formData, openingBalance: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold">نوع الرصيد</Label>
                                    <Select
                                        value={formData.openingBalanceType}
                                        onValueChange={val => setFormData({ ...formData, openingBalanceType: val })}
                                    >
                                        <SelectTrigger className="h-10 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="debit">عليه (مدين لنا)</SelectItem>
                                            <SelectItem value="credit">له (دائن لنا)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}


                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            حفظ البيانات
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}

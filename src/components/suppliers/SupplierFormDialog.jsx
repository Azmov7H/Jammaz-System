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
import { Wallet, Loader2, Building2 } from 'lucide-react';

export function SupplierFormDialog({ open, onOpenChange, mode = 'add', initialData, onSubmit, isPending }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        isActive: true,
        financialTrackingEnabled: true,
        paymentDay: 'None',
        supplyTerms: 0,
        openingBalance: '',
        openingBalanceType: 'credit' // credit = we owe supplier (normal), debit = supplier owes us
    });

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                address: initialData.address || '',
                isActive: initialData.isActive !== undefined ? initialData.isActive : true,
                financialTrackingEnabled: initialData.financialTrackingEnabled !== undefined ? initialData.financialTrackingEnabled : true,
                paymentDay: initialData.paymentDay || 'None',
                supplyTerms: initialData.supplyTerms || 0
            });
        } else if (mode === 'add' && open) {
            setFormData({
                name: '',
                phone: '',
                address: '',
                isActive: true,
                financialTrackingEnabled: true,
                paymentDay: 'None',
                supplyTerms: 0,
                openingBalance: '',
                openingBalanceType: 'credit'
            });
        }
    }, [mode, initialData, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-white/5 bg-card/95 backdrop-blur-3xl shadow-2xl rounded-[1.5rem]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-3">
                        <Building2 className="text-primary w-6 h-6" />
                        {mode === 'edit' ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold mr-1">اسم المورد *</Label>
                            <Input
                                required
                                className="h-12 rounded-xl bg-muted/30 border-white/10"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold mr-1">رقم الهاتف *</Label>
                            <Input
                                required
                                className="h-12 rounded-xl bg-muted/30 border-white/10 font-mono"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold mr-1">العنوان</Label>
                        <Input
                            className="h-12 rounded-xl bg-muted/30 border-white/10"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <Separator className="bg-white/5" />

                    <div className="bg-primary/5 p-5 rounded-2xl space-y-6 border border-primary/10">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Wallet size={14} /> التسهيلات المالية والسداد
                        </h4>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">تفعيل التتبع المالي</Label>
                                <p className="text-[10px] text-muted-foreground">تتبع المديونية وجدولة مواعيد التحصيل</p>
                            </div>
                            <Switch
                                checked={formData.financialTrackingEnabled}
                                onCheckedChange={checked => setFormData({ ...formData, financialTrackingEnabled: checked })}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold mr-1">يوم السداد الأسبوعي</Label>
                                <Select
                                    value={formData.paymentDay}
                                    onValueChange={val => setFormData({ ...formData, paymentDay: val })}
                                >
                                    <SelectTrigger className="h-11 rounded-xl bg-card border-white/10 text-xs">
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
                                <Label className="text-xs font-bold mr-1">فترة التوريد الافتراضية (يوم)</Label>
                                <Input
                                    type="number"
                                    className="h-11 rounded-xl bg-card border-white/10 text-xs"
                                    value={formData.supplyTerms}
                                    onChange={e => setFormData({ ...formData, supplyTerms: parseInt(e.target.value) || 0 })}
                                    placeholder="0 = نقدي"
                                />
                            </div>
                        </div>
                    </div>

                    {mode === 'add' && (
                        <div className="bg-primary/5 p-5 rounded-2xl space-y-6 border border-primary/10">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Wallet size={14} /> الرصيد الافتتاحي (ديون سابقة)
                            </h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold mr-1">المبلغ</Label>
                                    <Input
                                        type="number"
                                        className="h-11 rounded-xl bg-card border-white/10 text-xs"
                                        placeholder="0.00"
                                        value={formData.openingBalance}
                                        onChange={e => setFormData({ ...formData, openingBalance: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold mr-1">نوع الرصيد</Label>
                                    <Select
                                        value={formData.openingBalanceType}
                                        onValueChange={val => setFormData({ ...formData, openingBalanceType: val })}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl bg-card border-white/10 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="credit">لنا (علينا للمورد)</SelectItem>
                                            <SelectItem value="debit">لنا (المورد مدين لنا)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
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
                            className="rounded-xl px-8 font-black gradient-primary shadow-colored border-0 hover:scale-105 active:scale-95 transition-all"
                        >
                            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            حفظ المورد
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}

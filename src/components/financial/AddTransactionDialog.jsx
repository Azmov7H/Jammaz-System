'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus } from 'lucide-react';
import { SourceNumberField } from '@/components/financial/SourceNumberField';
import { PaymentMethodSelect } from '@/components/common/PaymentMethodSelect';

export function AddTransactionDialog({ open, onOpenChange, formData, setFormData, onSubmit, isPending, suppliers }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button
                    className="flex-1 gap-2 bg-success hover:bg-success text-white"
                    onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                >
                    <Plus size={18} />
                    <span>إيداع / وارد</span>
                </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
                <Button
                    className="flex-1 gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                >
                    <Minus size={18} />
                    <span>مصروف / صادر</span>
                </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>
                        {formData.type === 'INCOME' ? 'إيداع نقدي / إضافة رصيد' : 'تسجيل مصروف خارجي'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label>المبلغ (ج.م)</Label>
                        <Input
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div>
                        <Label>الوصف / السبب</Label>
                        <Input
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder={formData.type === 'INCOME' ? 'مثال: رأس مال إضافي' : 'مثال: فاتورة كهرباء'}
                        />
                    </div>
                    <div>
                        <Label>وسيلة الدفع / الاستلام</Label>
                        <PaymentMethodSelect
                            value={formData.method}
                            onValueChange={v => setFormData({ ...formData, method: v })}
                            placeholder="اختر الوسيلة"
                            // FIN-BANK-01 (T-08): pin the previously-default
                            // full list minus bank (history labels untouched).
                            methods={['cash', 'wallet', 'instapay', 'check']}
                        />
                    </div>

                    <SourceNumberField
                        method={formData.method}
                        value={formData.sourceNumber}
                        onChange={v => setFormData({ ...formData, sourceNumber: v })}
                        autoFocus
                    />

                    {formData.type === 'EXPENSE' && (
                        <>
                            <div>
                                <Label>تصنيف المصروف</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={v => setFormData({ ...formData, category: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر التصنيف" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="other">مصروفات عامة</SelectItem>
                                        <SelectItem value="supplier">دفعة لمورد (دين / مقدم)</SelectItem>
                                        <SelectItem value="rent">إيجار</SelectItem>
                                        <SelectItem value="utilities">مرافق (كهرباء/ماء)</SelectItem>
                                        <SelectItem value="salaries">رواتب</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.category === 'supplier' && (
                                <div>
                                    <Label>المورد</Label>
                                    <Select
                                        value={formData.supplierId}
                                        onValueChange={v => setFormData({ ...formData, supplierId: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر المورد" />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            {suppliers?.suppliers?.map(s => (
                                                <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                    <Button
                        onClick={onSubmit}
                        className={formData.type === 'INCOME' ? 'bg-success hover:bg-success' : ''}
                    >
                        {isPending ? 'جاري الحفظ...' : 'حفظ المعاملة'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

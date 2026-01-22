'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateDebt } from '@/hooks/useFinancial';
import { Loader2, Settings2, Calculator } from 'lucide-react';
import { format } from 'date-fns';

export function DebtEditDialog({ open, onOpenChange, debt }) {
    const [formData, setFormData] = useState({
        originalAmount: '',
        remainingAmount: '',
        dueDate: '',
        description: ''
    });

    const { mutate: updateDebt, isPending } = useUpdateDebt();

    useEffect(() => {
        if (debt && open) {
            setFormData({
                originalAmount: debt.originalAmount || 0,
                remainingAmount: debt.remainingAmount || 0,
                dueDate: debt.dueDate ? format(new Date(debt.dueDate), 'yyyy-MM-dd') : '',
                description: debt.description || ''
            });
        }
    }, [debt, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!debt) return;

        updateDebt({
            id: debt._id,
            data: {
                originalAmount: parseFloat(formData.originalAmount),
                remainingAmount: parseFloat(formData.remainingAmount),
                dueDate: formData.dueDate,
                description: formData.description
            }
        }, {
            onSuccess: () => onOpenChange(false)
        });
    };

    const collectedAmount = Math.max(0, (parseFloat(formData.originalAmount) || 0) - (parseFloat(formData.remainingAmount) || 0));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card/95 border-white/10 backdrop-blur-2xl rounded-[1.5rem]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black flex items-center gap-2">
                        <Settings2 className="text-primary" /> تعديل بيانات المديونية
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold mr-1">المبلغ الإجمالي (Original)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.originalAmount}
                                onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                                className="h-12 rounded-xl bg-muted/30 border-white/10 font-mono font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold mr-1">المبلغ {debt?.debtorType === 'Customer' ? 'المحصل' : 'المسدد'}</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={collectedAmount}
                                onChange={(e) => {
                                    const collected = parseFloat(e.target.value) || 0;
                                    const original = parseFloat(formData.originalAmount) || 0;
                                    const remaining = Math.max(0, original - collected);
                                    setFormData({ ...formData, remainingAmount: remaining });
                                }}
                                className="h-12 rounded-xl bg-muted/30 border-white/10 font-mono font-bold"
                                required
                            />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Calculator size={18} />
                            <span className="text-xs font-black">المبلغ المتبقي (محسوب تلقائياً)</span>
                        </div>
                        <span className="text-xl font-black text-blue-600 font-mono">
                            {(parseFloat(formData.originalAmount) - collectedAmount).toLocaleString()} <span className="text-[10px]">د.ل</span>
                        </span>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold mr-1">تاريخ الاستحقاق</Label>
                        <Input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="h-12 rounded-xl bg-muted/30 border-white/10 font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold mr-1">البيان / الوصف</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="h-12 rounded-xl bg-muted/30 border-white/10 font-bold"
                        />
                    </div>

                    <DialogFooter className="gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-6 h-12 font-bold">
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-12 rounded-xl px-8 font-black gradient-primary shadow-colored border-0 hover:scale-105 transition-all"
                        >
                            {isPending && <Loader2 className="animate-spin w-4 h-4 ml-2" />}
                            حفظ التعديلات
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

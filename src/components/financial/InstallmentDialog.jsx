'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateInstallments } from '@/hooks/useFinancial';
import { Calendar, Layers, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export function InstallmentDialog({ open, onOpenChange, debt }) {
    const [formData, setFormData] = useState({
        installmentsCount: '3',
        interval: 'monthly',
        startDate: format(new Date(), 'yyyy-MM-dd'),
    });

    const createInstallments = useCreateInstallments();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!debt) return;

        await createInstallments.mutateAsync({
            debtId: debt._id,
            data: {
                ...formData,
                installmentsCount: parseInt(formData.installmentsCount),
            }
        });
        onOpenChange(false);
    };

    if (!debt) return null;

    const amountPerInstallment = (debt.remainingAmount / parseInt(formData.installmentsCount || '1')).toFixed(2);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] border-white/10 bg-card/95 backdrop-blur-2xl rounded-[2rem] shadow-custom-xl overflow-hidden" dir="rtl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />

                <DialogHeader className="relative z-10 text-right">
                    <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Layers className="w-5 h-5 text-primary" />
                        </div>
                        جدولة المديونية
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium pr-12">
                        تقسيم مبلغ {debt.remainingAmount.toLocaleString()} د.ل على فترات منظمة
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4 relative z-10">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold flex items-center gap-2 pr-1">
                                <Clock size={14} className="text-primary" /> عدد الأقساط
                            </Label>
                            <Input
                                type="number"
                                min="2"
                                max="24"
                                value={formData.installmentsCount}
                                onChange={(e) => setFormData({ ...formData, installmentsCount: e.target.value })}
                                className="h-12 bg-muted/30 border-white/10 rounded-xl font-black text-lg focus:ring-primary/20"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold flex items-center gap-2 pr-1">
                                <Layers size={14} className="text-primary" /> تكرار القسط
                            </Label>
                            <Select
                                value={formData.interval}
                                onValueChange={(val) => setFormData({ ...formData, interval: val })}
                            >
                                <SelectTrigger className="h-12 bg-muted/30 border-white/10 rounded-xl font-bold focus:ring-primary/20">
                                    <SelectValue placeholder="اختر الفترة" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-white/10 rounded-xl">
                                    <SelectItem value="daily" className="font-bold">يومي</SelectItem>
                                    <SelectItem value="weekly" className="font-bold">أسبوعي</SelectItem>
                                    <SelectItem value="monthly" className="font-bold">شهري</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold flex items-center gap-2 pr-1">
                                <Calendar size={14} className="text-primary" /> تاريخ أول قسط
                            </Label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="h-12 bg-muted/30 border-white/10 rounded-xl font-bold focus:ring-primary/20"
                                required
                            />
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">قيمة القسط التقريبية</span>
                            <span className="font-black text-primary text-xl">
                                {amountPerInstallment} <span className="text-xs italic">د.ل</span>
                            </span>
                        </div>
                        <div className="h-px bg-primary/10 w-full" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">
                            * سيتم إنشاء {formData.installmentsCount} سجلات دفع مجدولة في النظام وتذكيرك بمواعيد استحقاقها تلقائياً.
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-12 rounded-xl font-bold flex-1"
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={createInstallments.isPending}
                            className="h-12 rounded-xl gradient-primary border-0 font-black shadow-lg shadow-primary/20 flex-1 text-white gap-2"
                        >
                            {createInstallments.isPending ? (
                                <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                                <CheckCircle2 size={18} />
                            )}
                            تأكيد الجدولة
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

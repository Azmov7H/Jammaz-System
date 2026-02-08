'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCustomerTotalPayment } from '@/hooks/useFinancial';
import { formatCurrency, cn } from '@/utils';
import { Loader2, Coins, User, TrendingUp, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UnifiedPaymentDialog({ open, onOpenChange, customerId, customerName, totalBalance }) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [notes, setNotes] = useState('');

    const { mutate: addPayment, isPending } = useCustomerTotalPayment();
    const router = useRouter();

    useEffect(() => {
        if (open) {
            setAmount(totalBalance?.toString() || '');
            setNotes(`تحصيل دفعة من الرصيد الإجمالي للعميل: ${customerName}`);
        }
    }, [open, totalBalance, customerName]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!customerId) return;

        addPayment({
            customerId,
            data: {
                amount: parseFloat(amount),
                method,
                note: notes
            }
        }, {
            onSuccess: (res) => {
                onOpenChange(false);
                if (res.data?.transaction?._id) {
                    router.push(`/financial/receipts/${res.data.transaction._id}`);
                }
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card/95 border-white/10 backdrop-blur-2xl rounded-[1.5rem]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black flex items-center gap-2">
                        <Coins className="text-primary" /> تحصيل المتبقي من الحساب
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black tracking-widest text-primary opacity-60">اسم العميل</span>
                                <span className="text-lg font-black">{customerName}</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-primary/10">
                            <span className="text-[10px] uppercase font-black tracking-widest text-primary opacity-60 block">إجمالي المتبقي حالياً</span>
                            <div className="text-3xl font-black tracking-tighter text-red-500 flex items-baseline gap-1">
                                {formatCurrency(totalBalance || 0)}
                                <span className="text-xs text-muted-foreground font-bold italic">ج.م</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center mr-1">
                            <Label className="text-xs font-bold font-black">قيمة التحصيل *</Label>
                            <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <TrendingUp size={10} /> سيتم توزيعها تلقائياً
                            </span>
                        </div>
                        <Input
                            type="number"
                            step="0.01"
                            max={totalBalance}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-12 rounded-xl bg-muted/30 border-white/10 font-mono font-bold text-lg"
                            required
                        />
                        {amount && !isNaN(amount) && (
                            <div className="flex justify-between items-center px-2 text-xs font-bold animate-fade-in">
                                <span className="text-muted-foreground">الرصيد المتوقع بعد السداد:</span>
                                <span className={cn(
                                    "font-mono",
                                    (totalBalance - parseFloat(amount)) > 0 ? "text-rose-500" : "text-emerald-500"
                                )}>
                                    {formatCurrency(Math.max(0, totalBalance - parseFloat(amount)))} ج.م
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold mr-1">طريقة السداد</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-white/10 font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">نقدي (Cash)</SelectItem>
                                <SelectItem value="bank">تحويل بنكي</SelectItem>
                                <SelectItem value="check">شيك</SelectItem>
                                <SelectItem value="wallet">محفظة كاش</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold mr-1">ملاحظات التحصيل</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="أي تفاصيل إضافية عن عملية التحصيل..."
                            className="bg-muted/30 border-white/10 rounded-xl resize-none h-24 font-bold"
                        />
                    </div>

                    <DialogFooter className="gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-6 h-12 font-bold">
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || !amount || parseFloat(amount) <= 0}
                            className="h-12 rounded-xl px-8 font-black bg-primary hover:bg-primary/90 text-white shadow-lg hover:scale-105 transition-all w-full md:w-auto"
                        >
                            {isPending && <Loader2 className="animate-spin w-4 h-4 ml-2" />}
                            تأكيد التحصيل
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function RedeemPointsDialog({ open, onOpenChange, customer, onRedeem, isPending }) {
    // If we want local state for points input
    const [redeemPoints, setRedeemPoints] = useState(0);

    const handleSubmit = () => {
        if (redeemPoints <= 0) {
            toast.error('يجب إدخال عدد نقاط أكبر من 0');
            return;
        }
        if (redeemPoints > (customer?.loyaltyPoints || 0)) {
            toast.error('النقاط المدخلة أكبر من المتاحة للعميل');
            return;
        }

        onRedeem({ id: customer._id, points: redeemPoints });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gift className="text-amber-500" /> استبدال نقاط الولاء ({customer?.name})
                    </DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-6 text-center">
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 inline-block mx-auto min-w-[200px]">
                        <p className="text-amber-700 text-sm font-bold mb-2">النقاط المتاحة</p>
                        <p className="text-4xl font-black text-amber-600">{customer?.loyaltyPoints || 0}</p>
                    </div>

                    <div className="space-y-3 px-4">
                        <Label className="text-right block">عدد النقاط المراد استبدالها</Label>
                        <Input
                            type="number"
                            className="text-center text-xl font-bold h-12"
                            value={redeemPoints}
                            onChange={(e) => setRedeemPoints(parseInt(e.target.value) || 0)}
                        />
                        <p className="text-[10px] text-muted-foreground">سيتم تحويل النقاط إلى رصيد مالي في حساب العميل مباشرة</p>
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                    <Button
                        className="bg-amber-500 hover:bg-amber-600 border-0"
                        onClick={handleSubmit}
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        تأكيد الاستبدال
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

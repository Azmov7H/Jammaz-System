'use client';

import { useState } from 'react';
import { usePurchaseOrder, useUpdatePOStatus } from '@/hooks/usePurchaseOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Printer, ArrowRight, CheckCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function PurchaseOrderInvoice() {
    const { id } = useParams();
    const router = useRouter();
    const { data: po, isLoading, error } = usePurchaseOrder(id);
    const { mutate: updateStatus, isPending: receiving } = useUpdatePOStatus();
    const [receiveDialog, setReceiveDialog] = useState(false);
    const [paymentType, setPaymentType] = useState('cash');

    const handleReceive = () => {
        updateStatus(
            { id, status: 'RECEIVED', paymentType },
            {
                onSuccess: () => {
                    setReceiveDialog(false);
                }
            }
        );
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="animate-spin w-10 h-10 text-primary" />
            </div>
        );
    }

    if (error) return <div className="p-10 text-center text-destructive">حدث خطأ أثناء تحميل الطلب.</div>;
    if (!po) return null;

    return (
        <div className="min-h-screen bg-muted/30 p-4 md:p-8 print:p-0 print:bg-white">
            {/* Action Bar (Hidden in Print) */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <ArrowRight size={18} /> عودة
                </Button>
                <div className="flex gap-2">
                    {po.status === 'PENDING' && (
                        <Button
                            onClick={() => setReceiveDialog(true)}
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle size={18} /> استلام البضاعة
                        </Button>
                    )}
                    <Button onClick={() => window.print()} variant="outline" className="gap-2">
                        <Printer size={18} /> طباعة الفاتورة
                    </Button>
                </div>
            </div>

            {/* Invoice Container */}
            <Card className="max-w-4xl mx-auto print:shadow-none print:border-none print:w-full">
                <CardContent className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b pb-8 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">أمر شراء</h1>
                            <p className="text-muted-foreground font-mono">PO #{po.poNumber}</p>
                            <div className="mt-4 space-y-1 text-sm">
                                <p><strong>التاريخ:</strong> {new Date(po.createdAt).toLocaleDateString('ar-SA')}</p>
                                <p>
                                    <strong>الحالة:</strong>
                                    <Badge variant={po.status === 'RECEIVED' ? 'default' : 'secondary'} className="mr-2">
                                        {po.status === 'RECEIVED' ? 'تم الاستلام' : 'معلق'}
                                    </Badge>
                                </p>
                                {po.status === 'RECEIVED' && po.paymentType && (
                                    <p>
                                        <strong>طريقة الدفع:</strong>
                                        <Badge variant="outline" className="mr-2">
                                            {po.paymentType === 'cash' ? 'نقدي' : po.paymentType === 'bank' ? 'تحويل بنكي' : 'آجل'}
                                        </Badge>
                                    </p>
                                )}
                                <p><strong>حرر بواسطة:</strong> {po.createdBy?.name || 'النظام'}</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <div className="mb-4">
                                <div className="text-2xl font-black text-primary">شركة الجماز</div>
                                <div className="text-sm text-muted-foreground font-semibold tracking-wide">للاستيراد والتصدير</div>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>القاهرة - العتبة</p>
                                <p>شارع العسيلي - ممر الجماز</p>
                                <p>هاتف: 01000000000</p>
                            </div>
                        </div>
                    </div>

                    {/* Supplier Info */}
                    <div className="bg-muted/50 p-4 rounded-lg mb-8 print:bg-background print:border">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">بيانات المورد</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-lg font-bold text-foreground">{po.supplier?.name}</p>
                            </div>
                            <div className="text-left text-sm text-muted-foreground">
                                <p>{po.supplier?.phone}</p>
                                <p>{po.supplier?.address || 'العنوان غير مسجل'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-primary">
                                <th className="py-3 text-right font-bold text-primary">المنتج</th>
                                <th className="py-3 text-center font-bold text-primary">الكمية</th>
                                <th className="py-3 text-center font-bold text-primary">سعر الوحدة</th>
                                <th className="py-3 text-left font-bold text-primary">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {po.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-4">
                                        <div className="font-semibold">{item.productId?.name || item.productName}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{item.productId?.code}</div>
                                    </td>
                                    <td className="py-4 text-center">{item.quantity}</td>
                                    <td className="py-4 text-center">{item.costPrice.toLocaleString()} ج.م</td>
                                    <td className="py-4 text-left font-bold">{(item.quantity * item.costPrice).toLocaleString()} ج.م</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end mb-12">
                        <div className="w-64 bg-muted/50 p-4 rounded-lg space-y-2 border print:bg-background">
                            <div className="flex justify-between text-lg font-bold text-primary">
                                <span>الإجمالي الكلي:</span>
                                <span>{po.totalCost.toLocaleString()} ج.م</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="grid grid-cols-2 gap-8 mt-12 print:mt-20">
                        <div className="text-center">
                            <div className="h-20 border-b border-border mb-2"></div>
                            <p className="text-sm font-semibold text-muted-foreground">توقيع المسؤول</p>
                        </div>
                        <div className="text-center">
                            <div className="h-20 border-b border-border mb-2"></div>
                            <p className="text-sm font-semibold text-muted-foreground">ختم المورد</p>
                        </div>
                    </div>

                    {/* Print Footer */}
                    <div className="hidden print:block text-center text-xs text-muted-foreground mt-12">
                        تم إصدار هذا المستند إلكترونياً
                    </div>
                </CardContent>
            </Card>

            {/* Receive Dialog */}
            <Dialog open={receiveDialog} onOpenChange={setReceiveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>استلام أمر الشراء</DialogTitle>
                        <DialogDescription>
                            تأكيد استلام البضاعة وإضافتها للمخزن.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>طريقة الدفع للمورد</Label>
                            <div className="flex gap-2">
                                <Button
                                    variant={paymentType === 'cash' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('cash')}
                                    className="flex-1"
                                >
                                    نقدي (من الخزينة)
                                </Button>
                                <Button
                                    variant={paymentType === 'bank' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('bank')}
                                    className="flex-1"
                                >
                                    تحويل بنكي
                                </Button>
                                <Button
                                    variant={paymentType === 'credit' ? 'default' : 'outline'}
                                    onClick={() => setPaymentType('credit')}
                                    className="flex-1"
                                >
                                    آجل (ذمم موردين)
                                </Button>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded text-sm text-slate-600">
                            {paymentType === 'cash'
                                ? 'سيتم خصم المبلغ من الخزينة وتسجيل قيد مصروفات.'
                                : paymentType === 'bank'
                                    ? 'سيتم تسجيل العملية بنكياً ولن تخصم من الخزينة.'
                                    : 'سيتم إضافة المبلغ لرصيد المورد وتسجيل قيد مستحقات.'}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReceiveDialog(false)}>إلغاء</Button>
                        <Button onClick={handleReceive} disabled={receiving} className="bg-green-600 hover:bg-green-700 text-white">
                            {receiving ? <Loader2 className="animate-spin" /> : 'تأكيد الاستلام'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    useDebts,
    useAddPayment,
    useDebtInstallments,
    useCreateInstallments,
    useSyncDebts,
    useUpdateDebt
} from '@/hooks/useFinancial';
import { Loader2, DollarSign, CalendarCheck, History, AlertCircle, ChevronLeft, RefreshCw, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DebtEditDialog } from '../financial/DebtEditDialog';

export function SupplierDebtManager({ supplier, open, onOpenChange }) {
    const [view, setView] = useState('list'); // 'list', 'payment', 'schedule', 'details'
    const [selectedDebt, setSelectedDebt] = useState(null);

    // Queries
    const { data: debtsData, isLoading: debtsLoading } = useDebts({
        debtorId: supplier?._id,
        debtorType: 'Supplier',
        status: 'active,overdue'
    });
    const debts = debtsData?.debts || [];

    const { data: installments, isLoading: installmentsLoading } = useDebtInstallments(selectedDebt?._id);

    // Mutations
    const recordPaymentMutation = useAddPayment();
    const scheduleMutation = useCreateInstallments();
    const syncMutation = useSyncDebts();

    // Form States
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNote, setPaymentNote] = useState('');

    const [installmentsCount, setInstallmentsCount] = useState('3');
    const [interval, setInterval] = useState('monthly');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const handleBack = () => {
        if (view === 'details' || view === 'payment' || view === 'schedule' || view === 'edit') setView('list');
        else onOpenChange(false);
    };

    const handleRecordPayment = () => {
        if (!selectedDebt || !paymentAmount || Number(paymentAmount) <= 0) return;

        recordPaymentMutation.mutate({
            debtId: selectedDebt._id,
            amount: Number(paymentAmount),
            method: paymentMethod,
            notes: paymentNote
        }, {
            onSuccess: () => {
                toast.success('تم تسجيل الدفعة بنجاح');
                setView('list');
                setPaymentAmount('');
                setPaymentNote('');
            },
            onError: (err) => {
                toast.error(err.message || 'فشل تسجيل الدفعة');
            }
        });
    };

    const handleSchedule = () => {
        if (!selectedDebt || !installmentsCount) return;

        scheduleMutation.mutate({
            debtId: selectedDebt._id,
            data: {
                installmentsCount: Number(installmentsCount),
                interval,
                startDate
            }
        }, {
            onSuccess: () => {
                toast.success('تمت جدولة الديون بنجاح');
                setView('list');
            },
            onError: (err) => {
                toast.error(err.message || 'فشل جدولة الديون');
            }
        });
    };

    // Inline Edit Form Component to avoid nested dialogs
    const EditDebtForm = ({ debt, onSuccess, onCancel }) => {
        const { mutate: updateDebt, isPending } = useUpdateDebt();
        const [formData, setFormData] = useState({
            originalAmount: debt.originalAmount || 0,
            remainingAmount: debt.remainingAmount || 0,
            dueDate: debt.dueDate ? format(new Date(debt.dueDate), 'yyyy-MM-dd') : '',
            description: debt.description || ''
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            updateDebt({
                id: debt._id,
                data: {
                    originalAmount: parseFloat(formData.originalAmount),
                    remainingAmount: parseFloat(formData.remainingAmount),
                    dueDate: formData.dueDate,
                    description: formData.description
                }
            }, {
                onSuccess: () => {
                    toast.success('تم تحديث بيانات الدين بنجاح');
                    onSuccess();
                }
            });
        };

        const collectedAmount = Math.max(0, (parseFloat(formData.originalAmount) || 0) - (parseFloat(formData.remainingAmount) || 0));

        return (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
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
                        <Label className="text-xs font-bold mr-1">المبلغ المسدد</Label>
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
                        <DollarSign size={18} />
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

                <div className="flex gap-3">
                    <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl px-6 h-12 font-bold flex-1">
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="h-12 rounded-xl px-8 font-black gradient-primary shadow-colored border-0 hover:scale-105 transition-all flex-1"
                    >
                        {isPending && <Loader2 className="animate-spin w-4 h-4 ml-2" />}
                        حفظ التعديلات
                    </Button>
                </div>
            </form>
        );
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                        {view !== 'list' && (
                            <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
                                <ChevronLeft className="w-5 h-5 rotate-180" />
                            </Button>
                        )}
                        <DialogTitle className="text-xl font-black">
                            {view === 'list' && `مديونية: ${supplier?.name}`}
                            {view === 'payment' && 'تسجيل دفعة سداد'}
                            {view === 'schedule' && 'جدولة الديون'}
                            {view === 'details' && 'تفاصيل الأقساط'}
                            {view === 'edit' && 'تعديل بيانات المديونية'}
                        </DialogTitle>
                    </div>
                    <div className="text-left">
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                            الرصيد: {supplier?.balance?.toLocaleString()} د.ل
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="py-6">
                    {view === 'list' && (
                        <div className="space-y-4">
                            {debtsLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : debts.length === 0 ? (
                                <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed space-y-4">
                                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground font-bold">لا توجد سجلات ديون مفصلة حالياً</p>
                                        {supplier?.balance > 0 && (
                                            <p className="text-[10px] text-muted-foreground">يوجد رصيد مستحق بقيمة {supplier.balance.toLocaleString()} د.ل ولكن لا توجد سجلات ديون من النظام الجديد.</p>
                                        )}
                                    </div>
                                    {supplier?.balance > 0 && (
                                        <Button
                                            onClick={() => syncMutation.mutate({ debtorId: supplier._id, debtorType: 'Supplier' })}
                                            disabled={syncMutation.isPending}
                                            className="gap-2 rounded-xl gradient-primary"
                                        >
                                            {syncMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                            مزامنة الرصيد كمديونية
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">البيان</TableHead>

                                            <TableHead className="text-center">المتبقي</TableHead>
                                            <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                                            <TableHead className="text-left">إجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {debts.map((debt) => (
                                            <TableRow key={debt._id}>
                                                <TableCell className="font-bold">
                                                    {debt.description || `أمر شراء #${debt.referenceId?.toString().slice(-6).toUpperCase()}`}
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <span className="font-black text-rose-500">{debt.remainingAmount?.toLocaleString()}</span>
                                                </TableCell>
                                                <TableCell className="text-center text-sm">
                                                    {format(new Date(debt.dueDate), 'yyyy/MM/dd')}
                                                </TableCell>
                                                <TableCell className="text-left">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1 border-amber-500/20 hover:bg-amber-500/5 text-amber-500"
                                                            onClick={() => { setSelectedDebt(debt); setView('edit'); }}
                                                        >
                                                            <Edit2 size={14} /> تعديل
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1 border-primary/20 hover:bg-primary/5 text-primary"
                                                            onClick={() => { setSelectedDebt(debt); setView('payment'); }}
                                                        >
                                                            <DollarSign size={14} /> سداد
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1 border-blue-500/20 hover:bg-blue-500/5 text-blue-500"
                                                            onClick={() => { setSelectedDebt(debt); setView('schedule'); }}
                                                        >
                                                            <CalendarCheck size={14} /> جدولة
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 gap-1"
                                                            onClick={() => { setSelectedDebt(debt); setView('details'); }}
                                                        >
                                                            <History size={14} /> سجل
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}

                    {view === 'payment' && selectedDebt && (
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-primary mb-1">المبلغ المتبقي</p>
                                    <p className="text-2xl font-black text-primary">{selectedDebt.remainingAmount?.toLocaleString()} د.ل</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-emerald-600 mb-0.5">تم سداد</p>
                                    <p className="text-lg font-black text-emerald-600">{(selectedDebt.originalAmount - selectedDebt.remainingAmount).toLocaleString()} د.ل</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>المبلغ المدفوع</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="h-12 text-lg font-bold"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        max={selectedDebt.remainingAmount}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>طريقة السداد</Label>
                                    <select
                                        className="w-full h-12 px-4 rounded-xl border bg-background font-bold"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="cash">نقداً (الخزينة)</option>
                                        <option value="wallet">محفظة كاش</option>
                                        <option value="bank">تحويل بنكي</option>
                                        <option value="check">شيك مصرفي</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>ملاحظات</Label>
                                    <Input
                                        placeholder="أي تفاصيل إضافية..."
                                        value={paymentNote}
                                        onChange={(e) => setPaymentNote(e.target.value)}
                                    />
                                </div>

                                <Button
                                    className="w-full h-14 rounded-xl font-black text-lg gradient-primary shadow-colored"
                                    onClick={handleRecordPayment}
                                    disabled={recordPaymentMutation.isPending || !paymentAmount}
                                >
                                    {recordPaymentMutation.isPending ? <Loader2 className="animate-spin" /> : 'تأكيد السداد'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {view === 'schedule' && selectedDebt && (
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                                <p className="text-sm font-bold text-blue-600 mb-1">إجمالي المديونية للجدولة</p>
                                <p className="text-2xl font-black text-blue-600">{selectedDebt.remainingAmount?.toLocaleString()} د.ل</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>عدد الأقساط</Label>
                                    <Input
                                        type="number"
                                        min="2"
                                        value={installmentsCount}
                                        onChange={(e) => setInstallmentsCount(e.target.value)}
                                        className="h-12 font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>الفترة بين كل قسط</Label>
                                    <select
                                        className="w-full h-12 px-4 rounded-xl border bg-background font-bold"
                                        value={interval}
                                        onChange={(e) => setInterval(e.target.value)}
                                    >
                                        <option value="weekly">أسبوعي</option>
                                        <option value="monthly">شهري</option>
                                        <option value="daily">يومي</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>تاريخ بداية الاستحقاق</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-12 font-bold"
                                    />
                                </div>

                                <div className="p-4 bg-muted/30 rounded-xl text-center">
                                    <p className="text-xs text-muted-foreground font-bold mb-1">قيمة القسط التقريبية</p>
                                    <p className="text-xl font-black">
                                        {(selectedDebt.remainingAmount / (Number(installmentsCount) || 1)).toLocaleString()} د.ل
                                    </p>
                                </div>

                                <Button
                                    className="w-full h-14 rounded-xl font-black text-lg bg-blue-600 hover:bg-blue-700 shadow-lg text-white"
                                    onClick={handleSchedule}
                                    disabled={scheduleMutation.isPending || !installmentsCount}
                                >
                                    {scheduleMutation.isPending ? <Loader2 className="animate-spin" /> : 'إنشاء خطة الأقساط'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {view === 'details' && selectedDebt && (
                        <div className="space-y-4">
                            {installmentsLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : !installments || installments.length === 0 ? (
                                <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed">
                                    <p className="text-muted-foreground font-bold">لا توجد أقساط مجدولة لهذا الدين بعد</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">القسط</TableHead>
                                            <TableHead className="text-center">المبلغ</TableHead>
                                            <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                                            <TableHead className="text-center">الحالة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {installments.map((inst, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-bold">قسط رقم {idx + 1}</TableCell>
                                                <TableCell className="text-center font-mono font-bold">{inst.amount?.toLocaleString()}</TableCell>
                                                <TableCell className="text-center text-sm">
                                                    {format(new Date(inst.dueDate), 'PPP', { locale: ar })}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant={inst.status === 'PAID' ? 'success' : inst.status === 'OVERDUE' ? 'destructive' : 'secondary'}
                                                    >
                                                        {inst.status === 'PAID' ? 'تم السداد' : inst.status === 'OVERDUE' ? 'متأخر' : 'قيد الانتظار'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}

                    {view === 'edit' && selectedDebt && (
                        <EditDebtForm
                            debt={selectedDebt}
                            onSuccess={() => setView('list')}
                            onCancel={() => setView('list')}
                        />
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
                        إغلاق
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

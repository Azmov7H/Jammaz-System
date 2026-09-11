'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
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
import { Wallet, Loader2, Truck, Link2 } from 'lucide-react';
import { getSuppliers } from '@/services/supplierService';

import { FormField, mapServerFieldErrors } from '@/components/forms/FormField';
import { zodResolver } from '@/components/forms/zodResolver';
import { customerSchema } from '@/validations/customer.schema';

const DEFAULT_VALUES = {
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
    shippingCompany: '',
    taxNumber: '',
    isSupplier: false,
    linkedSupplier: ''
};

export function CustomerFormDialog({ open, onOpenChange, mode = 'add', initialData, onSubmit, isPending }) {
    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        setError,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(customerSchema),
        defaultValues: DEFAULT_VALUES
    });

    const isSupplier = watch('isSupplier');

    const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
        queryKey: ['suppliers', 'dialog', { limit: 100 }],
        queryFn: ({ signal }) => getSuppliers({ limit: 100 }, { signal }),
        enabled: open
    });
    const suppliers = suppliersData?.suppliers || suppliersData?.data?.suppliers || suppliersData || [];

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && initialData) {
            const linkedSupplier =
                typeof initialData.linkedSupplier === 'object' && initialData.linkedSupplier !== null
                    ? initialData.linkedSupplier._id || initialData.linkedSupplier.id || ''
                    : initialData.linkedSupplier || '';
            reset({
                ...DEFAULT_VALUES,
                ...initialData,
                creditLimit: initialData.creditLimit ?? '',
                paymentTerms: initialData.paymentTerms ?? 0,
                collectionDay: initialData.collectionDay || 'None',
                isSupplier: !!initialData.isSupplier,
                linkedSupplier
            });
        } else if (mode === 'add') {
            reset(DEFAULT_VALUES);
        }
    }, [mode, initialData, open, reset]);

    const onValid = async (values) => {
        try {
            await onSubmit({
                ...values,
                isSupplier: !!values.isSupplier,
                // T-DB-03b: omit the link when unlinked — an explicit null hits
                // the sparse-unique index and 409s the SECOND such record.
                linkedSupplier: values.isSupplier ? (values.linkedSupplier || undefined) : undefined
            });
        } catch (err) {
            const serverErrors = mapServerFieldErrors(err);
            if (serverErrors) {
                Object.entries(serverErrors).forEach(([field, error]) => setError(field, error));
            } else {
                throw err;
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="اسم العميل" required error={errors.name}>
                            <Input
                                {...register('name')}
                                aria-invalid={!!errors.name}
                            />
                        </FormField>
                        <FormField label="رقم الهاتف" required error={errors.phone}>
                            <Input
                                {...register('phone')}
                                aria-invalid={!!errors.phone}
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="نوع التسعير" error={errors.priceType}>
                            <SelectField control={control} name="priceType">
                                <SelectItem value="retail">قطاعي (عادي)</SelectItem>
                                <SelectItem value="wholesale">جملة</SelectItem>
                                <SelectItem value="special">خاص</SelectItem>
                            </SelectField>
                        </FormField>
                        <FormField label="حد الائتمان (الديون)" hint="(0 = مفتوح)" error={errors.creditLimit}>
                            <Input
                                type="number"
                                {...register('creditLimit')}
                                placeholder="أدخل الحد الأقصى للديون (0 للمفتوح)"
                            />
                        </FormField>
                    </div>

                    <FormField label="الرقم الضريبي" hint="اختياري" error={errors.taxNumber}>
                        <Input
                            {...register('taxNumber')}
                            placeholder="الرقم الضريبي للسجل التجاري..."
                        />
                    </FormField>

                    <FormField label="العنوان" error={errors.address}>
                        <Input {...register('address')} />
                    </FormField>

                    <FormField label="ملاحظات" error={errors.notes}>
                        <Input {...register('notes')} />
                    </FormField>

                    <FormField error={errors.shippingCompany}>
                        <Label className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-primary" />
                            شركة الشحن (اختياري)
                        </Label>
                        <Input
                            {...register('shippingCompany')}
                            placeholder="اسم شركة الشحن المفضلة..."
                        />
                    </FormField>

                    <Separator />
                    <div className="bg-primary/5 p-4 rounded-xl space-y-4 border border-primary/10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                            <Wallet size={14} /> التحكم في المديونية والتحصيل
                        </h4>

                        <SwitchField control={control} name="financialTrackingEnabled" />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="يوم التحصيل المفضل" error={errors.collectionDay} className="[&_>span]:text-xs">
                                <SelectField control={control} name="collectionDay" triggerClassName="h-9 text-xs">
                                    <SelectItem value="None">غير محدد</SelectItem>
                                    <SelectItem value="Saturday">السبت</SelectItem>
                                    <SelectItem value="Sunday">الأحد</SelectItem>
                                    <SelectItem value="Monday">الاثنين</SelectItem>
                                    <SelectItem value="Tuesday">الثلاثاء</SelectItem>
                                    <SelectItem value="Wednesday">الأربعاء</SelectItem>
                                    <SelectItem value="Thursday">الخميس</SelectItem>
                                    <SelectItem value="Friday">الجمعة</SelectItem>
                                </SelectField>
                            </FormField>
                            <FormField label="فترة السداد الخاصة (يوم)" hint="0 = الافتراضي" error={errors.paymentTerms}>
                                <Input type="number" className="h-9 text-xs" {...register('paymentTerms')} />
                            </FormField>
                        </div>
                    </div>

                    {mode === 'add' && (
                        <div className="bg-muted p-4 rounded-xl border border-border space-y-4">
                            <Label className="text-xs font-bold text-primary">الرصيد الافتتاحي (ديون سابقة)</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="المبلغ" error={errors.openingBalance}>
                                    <Input
                                        type="number"
                                        className="h-10 text-sm"
                                        placeholder="0.00"
                                        {...register('openingBalance')}
                                    />
                                </FormField>
                                <FormField label="نوع الرصيد" error={errors.openingBalanceType}>
                                    <SelectField control={control} name="openingBalanceType" triggerClassName="h-10 text-sm">
                                        <SelectItem value="debit">عليه (مدين لنا)</SelectItem>
                                        <SelectItem value="credit">له (دائن لنا)</SelectItem>
                                    </SelectField>
                                </FormField>
                            </div>
                        </div>
                    )}

                    <div className="bg-primary/5 p-4 rounded-xl space-y-4 border border-primary/10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                            <Link2 size={14} /> إضافة كمورد / ربط بمورد
                        </h4>

                        <Controller
                            control={control}
                            name="isSupplier"
                            render={({ field }) => (
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm">هذا العميل مورد أيضًا</Label>
                                        <p className="text-xs text-muted-foreground">ربط العميل بمورد لتوحيد الأرصدة وحل التكرار</p>
                                    </div>
                                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                </div>
                            )}
                        />

                        {isSupplier && (
                            <FormField label="المورد المرتبط" error={errors.linkedSupplier}>
                                <Controller
                                    control={control}
                                    name="linkedSupplier"
                                    render={({ field }) => (
                                        <Select value={field.value || ''} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={suppliersLoading ? 'جاري تحميل الموردين...' : 'اختر المورد لربطه...'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map((s) => (
                                                    <SelectItem key={s._id} value={s._id}>
                                                        {s.name} {s.phone ? `(${s.phone})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </FormField>
                        )}
                    </div>


                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={isPending || isSubmitting}>
                            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            حفظ البيانات
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}

/* RHF ↔ shadcn bindings used by this dialog (canonical examples for the pattern doc) */

function SelectField({ control, name, children, triggerClassName }) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger className={triggerClassName}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>{children}</SelectContent>
                </Select>
            )}
        />
    );
}

function SwitchField({ control, name }) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm">تفعيل التتبع المالي</Label>
                        <p className="text-xs text-muted-foreground">توليد إشعارات تحصيل لهذا العميل</p>
                    </div>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </div>
            )}
        />
    );
}

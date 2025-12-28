'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Phone, MapPin, Loader2, Pencil, Settings2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSuppliers, useAddSupplier, useUpdateSupplier } from '@/hooks/useSuppliers';

export default function SuppliersPage() {
    const { data: suppliers = [], isLoading } = useSuppliers();
    const addMutation = useAddSupplier();
    const updateMutation = useUpdateSupplier();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        financialTrackingEnabled: true,
        paymentDay: 'None',
        supplyTerms: 0
    });

    const handleEdit = (supplier) => {
        setFormData({
            name: supplier.name,
            phone: supplier.phone || '',
            address: supplier.address || '',
            financialTrackingEnabled: supplier.financialTrackingEnabled !== undefined ? supplier.financialTrackingEnabled : true,
            paymentDay: supplier.paymentDay || 'None',
            supplyTerms: supplier.supplyTerms || 0
        });
        setCurrentId(supplier._id);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEditing) {
            updateMutation.mutate({ id: currentId, data: formData }, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setIsEditing(false);
                    setFormData({
                        name: '',
                        phone: '',
                        address: '',
                        financialTrackingEnabled: true,
                        paymentDay: 'None',
                        supplyTerms: 0
                    });
                }
            });
        } else {
            addMutation.mutate(formData, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setFormData({
                        name: '',
                        phone: '',
                        address: '',
                        financialTrackingEnabled: true,
                        paymentDay: 'None',
                        supplyTerms: 0
                    });
                }
            });
        }
    };

    const isSubmitting = addMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">الموردين</h1>
                    <p className="text-sm text-muted-foreground">إدارة شبكة الموردين</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setFormData({
                            name: '',
                            phone: '',
                            address: '',
                            financialTrackingEnabled: true,
                            paymentDay: 'None',
                            supplyTerms: 0
                        });
                        setIsEditing(false);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={18} />
                            مورد جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>اسم المورد</Label>
                                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>رقم الهاتف</Label>
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>العنوان</Label>
                                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>

                            <Separator />
                            <div className="bg-primary/5 p-4 rounded-xl space-y-4 border border-primary/10">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                    <Settings2 size={14} /> التحكم المالي والمدفوعات
                                </h4>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm">تفعيل التتبع المالي</Label>
                                        <p className="text-[10px] text-muted-foreground">توليد إشعارات سداد لهذا المورد</p>
                                    </div>
                                    <Switch
                                        checked={formData.financialTrackingEnabled}
                                        onCheckedChange={checked => setFormData({ ...formData, financialTrackingEnabled: checked })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">يوم السداد المفضل</Label>
                                        <Select
                                            value={formData.paymentDay}
                                            onValueChange={val => setFormData({ ...formData, paymentDay: val })}
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
                                        <Label className="text-xs">فترة التوريد الخاصة (يوم)</Label>
                                        <Input
                                            type="number"
                                            className="h-9 text-xs"
                                            value={formData.supplyTerms}
                                            onChange={e => setFormData({ ...formData, supplyTerms: parseInt(e.target.value) || 0 })}
                                            placeholder="0 = الافتراضي"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'جاري الحفظ...' : (isEditing ? 'حفظ التعديلات' : 'حفظ')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">الاسم</TableHead>
                            <TableHead className="text-right">الهاتف</TableHead>
                            <TableHead className="text-right hidden md:table-cell">ال عنوان</TableHead>
                            <TableHead className="text-left">الرصيد</TableHead>
                            <TableHead className="text-right hidden lg:table-cell">تاريخ التوريد</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    لا يوجد موردين
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((sup) => (
                                <TableRow key={sup._id}>
                                    <TableCell className="font-medium">{sup.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            {sup.phone && <Phone size={14} />}
                                            {sup.phone || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            {sup.address && <MapPin size={14} />}
                                            {sup.address || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-left font-bold font-mono">
                                        {sup.balance > 0 ? (
                                            <span className="text-destructive">-{sup.balance.toLocaleString()}</span>
                                        ) : (
                                            <span className="text-muted-foreground">0</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                        {sup.lastSupplyDate
                                            ? new Date(sup.lastSupplyDate).toLocaleDateString('ar-SA')
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(sup)}>
                                            <Pencil size={16} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

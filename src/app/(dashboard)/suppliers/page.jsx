'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Phone, MapPin, Loader2, Pencil } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useSuppliers, useAddSupplier, useUpdateSupplier } from '@/hooks/useSuppliers';

export default function SuppliersPage() {
    const { data: suppliers = [], isLoading } = useSuppliers();
    const addMutation = useAddSupplier();
    const updateMutation = useUpdateSupplier();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });

    const handleEdit = (supplier) => {
        setFormData({
            name: supplier.name,
            phone: supplier.phone || '',
            address: supplier.address || ''
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
                    setFormData({ name: '', phone: '', address: '' });
                }
            });
        } else {
            addMutation.mutate(formData, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setFormData({ name: '', phone: '', address: '' });
                }
            });
        }
    };

    const isSubmitting = addMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">الموردين</h1>
                    <p className="text-sm text-slate-500">إدارة شبكة الموردين</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setFormData({ name: '', phone: '', address: '' });
                        setIsEditing(false);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#1B3C73] hover:bg-slate-800 gap-2">
                            <Plus size={18} />
                            مورد جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md" dir="rtl">
                        <DialogHeader>
                            <DialogTitle className="text-right">{isEditing ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</DialogTitle>
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
                            <DialogFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : (isEditing ? 'حفظ التعديلات' : 'حفظ')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">الاسم</TableHead>
                            <TableHead className="text-right">الهاتف</TableHead>
                            <TableHead className="text-right">العنوان</TableHead>
                            <TableHead className="text-right">تاريخ التوريد</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="animate-spin mx-auto text-[#1B3C73]" />
                                </TableCell>
                            </TableRow>
                        ) : suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                    لا يوجد موردين
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((sup) => (
                                <TableRow key={sup._id}>
                                    <TableCell className="font-medium">{sup.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            {sup.phone && <Phone size={14} />}
                                            {sup.phone || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            {sup.address && <MapPin size={14} />}
                                            {sup.address || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {sup.lastSupplyDate
                                            ? new Date(sup.lastSupplyDate).toLocaleDateString('ar-EG')
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Button size="icon" variant="ghost" className="hover:bg-slate-100 text-slate-500" onClick={() => handleEdit(sup)}>
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

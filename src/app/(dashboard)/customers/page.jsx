'use client';

import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, FileEdit, Trash2, Phone, MapPin, Loader2, Wallet, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const { data: customers = [], isLoading, addMutation, updateMutation, deleteMutation } = useCustomers({ search });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        priceType: 'retail',
        address: '',
        creditLimit: '',
        notes: ''
    });

    const resetForm = () => {
        setFormData({ name: '', phone: '', priceType: 'retail', address: '', creditLimit: '', notes: '' });
        setSelectedCustomer(null);
    };

    const handleEditClick = (customer) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            priceType: customer.priceType || 'retail',
            address: customer.address || '',
            creditLimit: customer.creditLimit || '',
            notes: customer.notes || ''
        });
        setIsEditOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0
        };

        if (selectedCustomer) {
            updateMutation.mutate({ id: selectedCustomer._id, data: payload }, {
                onSuccess: () => setIsEditOpen(false)
            });
        } else {
            addMutation.mutate(payload, {
                onSuccess: () => {
                    setIsAddOpen(false);
                    resetForm();
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من تعطيل حساب هذا العميل؟')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">إدارة العملاء</h1>
                    <p className="text-muted-foreground">قائمة العملاء وبيانات الاتصال والأسعار</p>
                </div>
                <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="gap-2">
                    <Plus size={16} /> إضافة عميل جديد
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                    placeholder="بحث باسم العميل أو رقم الهاتف..."
                    className="pr-10 max-w-md bg-card"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>اسم العميل</TableHead>
                            <TableHead>معلومات الاتصال</TableHead>
                            <TableHead>نوع السعر</TableHead>
                            <TableHead>الرصيد</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                    لا يوجد عملاء
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer) => (
                                <TableRow key={customer._id}>
                                    <TableCell>
                                        <div className="font-semibold flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                                                <UserIcon size={14} />
                                            </div>
                                            {customer.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone size={12} /> {customer.phone}
                                            </div>
                                            {customer.address && (
                                                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                                    <MapPin size={12} /> {customer.address}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {customer.priceType === 'wholesale' ? 'جملة' :
                                                customer.priceType === 'special' ? 'خاص' : 'قطاعي'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className={cn(
                                            "font-bold font-mono",
                                            customer.balance > 0 ? "text-red-500" : "text-green-600"
                                        )}>
                                            {customer.balance?.toLocaleString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={customer.isActive ? "secondary" : "destructive"}>
                                            {customer.isActive ? 'نشط' : 'متوقف'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(customer)}>
                                                <FileEdit size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => router.push(`/receivables?customerId=${customer._id}`)}
                                                title="سجل الديون"
                                            >
                                                <Wallet size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(customer._id)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditOpen ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم العميل *</Label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>رقم الهاتف *</Label>
                                <Input
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>نوع التسعير</Label>
                                <Select
                                    value={formData.priceType}
                                    onValueChange={val => setFormData({ ...formData, priceType: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="retail">قطاعي (عادي)</SelectItem>
                                        <SelectItem value="wholesale">جملة</SelectItem>
                                        <SelectItem value="special">خاص</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>حد الائتمان (الديون)</Label>
                                <Input
                                    type="number"
                                    value={formData.creditLimit}
                                    onChange={e => setFormData({ ...formData, creditLimit: e.target.value })}
                                    placeholder="0 = مفتوح"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>العنوان</Label>
                            <Input
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Input
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending}>
                                {(addMutation.isPending || updateMutation.isPending) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                حفظ البيانات
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useSuppliers } from '@/hooks/useSuppliers';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, FileEdit, Trash2, Phone, MapPin, Loader2, Wallet, Building2, Activity, CalendarClock, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { KPICard } from '@/components/dashboard/KPICard';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { Badge } from '@/components/ui/badge';

export default function SuppliersPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const { data: queryData, isLoading, addMutation, updateMutation, deleteMutation } = useSuppliers({ search });
    const suppliers = queryData?.suppliers || [];

    const handleEditClick = (supplier) => {
        setSelectedSupplier(supplier);
        setIsEditOpen(true);
    };

    const handleFormSubmit = (formData) => {
        if (selectedSupplier) {
            updateMutation.mutate({ id: selectedSupplier._id, data: formData }, {
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedSupplier(null);
                }
            });
        } else {
            addMutation.mutate(formData, {
                onSuccess: () => {
                    setIsAddOpen(false);
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
            deleteMutation.mutate(id);
        }
    };

    // Stats
    const activeSuppliers = suppliers.filter(s => s.isActive).length;
    const debtSuppliers = suppliers.filter(s => s.balance > 0).length;
    const trackedSuppliers = suppliers.filter(s => s.financialTrackingEnabled).length;

    return (
        <div className="space-y-8 animate-fade-in-up" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <Building2 className="text-primary w-8 h-8" />
                        إدارة الموردين
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">إضافة وتعديل الموردين وجدولة مواعيد السداد</p>
                </div>
                <Button
                    onClick={() => { setSelectedSupplier(null); setIsAddOpen(true); }}
                    className="h-14 px-8 rounded-2xl font-black gap-2 gradient-primary border-0 shadow-colored hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" /> إضافة مورد جديد
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="إجمالي الموردين" value={suppliers.length} icon={Building2} variant="default" />
                <KPICard title="موردين نشطين" value={activeSuppliers} icon={Activity} variant="success" />
                <KPICard title="مديونية للموردين" value={debtSuppliers} icon={Wallet} variant="destructive" />
                <KPICard title="تتبع مالي" value={trackedSuppliers} icon={CalendarClock} variant="primary" />
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Search className="h-5 w-5" />
                </div>
                <Input
                    placeholder="بحث باسم المورد، العنوان، أو رقم الهاتف..."
                    className="h-14 pr-12 rounded-2xl bg-card border-white/5 shadow-custom-md focus-visible:ring-primary/20 focus-visible:bg-accent/50 transition-all text-lg font-bold"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden bg-card border border-white/5 rounded-[2rem] shadow-custom-xl">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-white/5 h-16">
                            <TableHead className="font-black text-xs uppercase tracking-widest text-right px-6">المورد / الحالة</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-widest text-right">الاتصال</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-widest text-center">يوم السداد</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-widest text-center">المستحقات</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-widest text-center">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary w-10 h-10" />
                                </TableCell>
                            </TableRow>
                        ) : suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center text-muted-foreground font-bold">
                                    <div className="flex flex-col items-center gap-4 opacity-50">
                                        <Building2 className="w-16 h-16" />
                                        <p>لا يوجد موردين مطابقين للبحث</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((supplier) => (
                                <TableRow key={supplier._id} className="group hover:bg-muted/50 transition-colors h-20 border-white/5">
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-lg group-hover:scale-110 transition-transform">
                                                <AvatarFallback className="bg-gradient-to-tr from-primary to-primary/60 text-white font-black italic">
                                                    {supplier.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-black text-foreground text-sm group-hover:text-primary transition-colors">{supplier.name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant={supplier.isActive ? "secondary" : "destructive"}
                                                        className="text-[10px] h-4 font-black"
                                                    >
                                                        {supplier.isActive ? 'نشط' : 'متوقف'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                                <Phone size={12} className="text-primary" />
                                                <span className="font-mono">{supplier.phone || '---'}</span>
                                            </div>
                                            {supplier.address && (
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                                                    <MapPin size={10} />
                                                    <span className="truncate max-w-[150px]">{supplier.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="font-bold border-2 bg-muted/50">
                                            {supplier.paymentDay === 'None' ? 'غير محدد' :
                                                supplier.paymentDay === 'Saturday' ? 'السبت' :
                                                    supplier.paymentDay === 'Sunday' ? 'الأحد' :
                                                        supplier.paymentDay === 'Monday' ? 'الاثنين' :
                                                            supplier.paymentDay === 'Tuesday' ? 'الثلاثاء' :
                                                                supplier.paymentDay === 'Wednesday' ? 'الأربعاء' :
                                                                    supplier.paymentDay === 'Thursday' ? 'الخميس' : 'الجمعة'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {supplier.balance > 0 ? (
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-2 font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20 text-xs shadow-sm">
                                                    <span className="font-mono">{supplier.balance.toLocaleString()}</span>
                                                    <span className="text-[10px] opacity-70 italic">د.ل</span>
                                                </div>
                                                <span className="text-[9px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">مستحقات للمورد</span>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="opacity-50 font-bold border-dashed border-2">0.00</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(supplier)}
                                                className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                                title="تعديل"
                                            >
                                                <FileEdit size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl hover:bg-blue-500/10 text-blue-500 transition-all"
                                                onClick={() => router.push(`/purchase-orders?supplierId=${supplier._id}`)}
                                                title="سجل المشتريات"
                                            >
                                                <History size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                                                onClick={() => handleDelete(supplier._id)}
                                                title="حذف"
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

            <SupplierFormDialog
                open={isAddOpen || isEditOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddOpen(false);
                        setIsEditOpen(false);
                        setSelectedSupplier(null);
                    }
                }}
                mode={isEditOpen ? 'edit' : 'add'}
                initialData={selectedSupplier}
                onSubmit={handleFormSubmit}
                isPending={addMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}

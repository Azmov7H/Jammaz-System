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
import { Search, Plus, FileEdit, Trash2, Phone, MapPin, Loader2, Wallet, Building2, Activity, CalendarClock, History, RefreshCcw, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';
import { useRouter } from 'next/navigation';
import { KPICard } from '@/components/dashboard/KPICard';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SupplierDebtManager } from '@/components/suppliers/SupplierDebtManager';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExportButton } from '@/components/common/ExportButton';

export default function SuppliersPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDebtOpen, setIsDebtOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const { data: queryData, isLoading, isFetching, isError, error, refetch, addMutation, updateMutation, deleteMutation } = useSuppliers({ search });
    const suppliers = queryData?.suppliers || [];

    const handleEditClick = (supplier) => {
        setSelectedSupplier(supplier);
        setIsEditOpen(true);
    };

    const handleFormSubmit = (formData) => {
        // Prevent duplicate submissions
        if (addMutation.isPending || updateMutation.isPending) {
            toast.warning('جاري معالجة الطلب، يرجى الانتظار...');
            return;
        }

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

    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const handleDelete = (id) => {
        setDeleteTargetId(id);
    };

    const handleConfirmDelete = () => {
        if (deleteTargetId) {
            deleteMutation.mutate(deleteTargetId);
        }
        setDeleteTargetId(null);
    };

    // Stats
    const activeSuppliers = suppliers.filter(s => s.isActive).length;
    const debtSuppliers = suppliers.filter(s => s.balance > 0).length;
    const trackedSuppliers = suppliers.filter(s => s.financialTrackingEnabled).length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}

            {/* Header Section */}
            <PageHeader
                title="إدارة الموردين"
                subtitle="قاعدة بيانات الموردين، المديونات وجدولة المشتريات"
                icon={Building2}
                actions={
                    <>
                        <div className="hidden xl:flex items-center gap-6 glass-card px-8 py-4 rounded-3xl border border-white/10 shadow-xl ml-4">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">إجمالي الموردين</span>
                                <span className="text-xl font-bold tabular-nums">{(suppliers.length || 0).toLocaleString()}</span>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="flex flex-col items-end text-destructive">
                                <span className="text-xs font-bold opacity-60 uppercase tracking-[0.2em]">إجمالي المديونيات</span>
                                <span className="text-xl font-bold tabular-nums">{(suppliers.reduce((sum, s) => sum + (s.balance || 0), 0) || 0).toLocaleString()} ج.م</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ExportButton type="suppliers" filters={{ search }} />
                            <Button
                                onClick={() => { setSelectedSupplier(null); setIsAddOpen(true); }}
                            className="h-14 px-8 rounded-2xl font-bold text-lg gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex-1 lg:flex-none bg-primary text-primary-foreground"
                        >
                            <Plus size={24} />
                            إضافة مورد
                        </Button>
                        </div>
                    </>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="إجمالي الموردين" value={suppliers.length} icon={Building2} variant="primary" />
                <KPICard title="موردين نشطين" value={activeSuppliers} icon={Activity} variant="success" />
                <KPICard title="مديونية للموردين" value={debtSuppliers} icon={Wallet} variant="warning" />
                <KPICard title="تتبع مالي" value={trackedSuppliers} icon={CalendarClock} variant="secondary" />
            </div>

            {/* Control Bar */}
            <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between">
                <div className="relative group flex-1">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary h-6 w-6 group-focus-within:animate-pulse transition-all" />
                    <Input
                        placeholder="ابحث باسم المورد، العنوان، أو رقم الهاتف..."
                        className="h-16 pr-16 pl-8 rounded-[2rem] bg-card/40 border-white/10 focus:bg-card/60 focus:border-primary/50 transition-all font-bold text-xl placeholder:text-muted-foreground/30 shadow-2xl backdrop-blur-xl ring-0 focus-visible:ring-0"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Suppliers Table Container */}
            <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                        <h2 className="text-2xl font-bold tracking-tight">قائمة الموردين</h2>
                        <span className="text-xs text-muted-foreground font-bold">
                            ({suppliers.length} مورد)
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="تحديث القائمة"
                        title="تحديث القائمة"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="h-12 w-12 rounded-2xl glass-card border-white/10 hover:border-primary/50 transition-all shadow-lg"
                    >
                        <RefreshCcw className={cn("h-5 w-5 text-muted-foreground", isFetching && "animate-spin text-primary")} />
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <Table aria-label="قائمة الموردين">
<TableHeader>
                                <TableRow className="hover:bg-transparent border-white/5 h-16 bg-white/[0.01]">
                                    <TableHead className="font-bold text-white/40 uppercase tracking-widest text-xs px-8 text-right">المورد / الحالة</TableHead>
                                    <TableHead className="font-bold text-white/40 uppercase tracking-widest text-xs px-8 text-right">الاتصال</TableHead>
                                    <TableHead className="font-bold text-white/40 uppercase tracking-widest text-xs px-8 text-center">يوم السداد</TableHead>
                                    <TableHead className="font-bold text-white/40 uppercase tracking-widest text-xs px-8 text-center">الرصيد المالي</TableHead>
                                    <TableHead className="font-bold text-white/40 uppercase tracking-widest text-xs px-8 text-center">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                        <TableBody>
                            {isError ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-96 text-center border-none">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="p-8 bg-destructive/10 rounded-[2.5rem] border border-destructive/20 shadow-inner">
                                                <AlertCircle size={64} className="text-destructive" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-2xl font-bold text-destructive">تعذر تحميل قائمة الموردين</p>
                                                <p className="text-sm text-muted-foreground font-medium">
                                                    {error?.message || 'حدث خطأ أثناء جلب البيانات من الخادم'}
                                                </p>
                                            </div>
                                            <Button onClick={() => refetch()} variant="outline" className="gap-2">
                                                <RefreshCcw className="h-4 w-4" /> إعادة المحاولة
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-96 text-center border-none">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                                                <Loader2 size={64} className="text-primary animate-spin" />
                                            </div>
                                            <p className="text-2xl font-bold text-white/30 italic">جاري المزامنة...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : suppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-96 text-center border-none">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner group">
                                                <Building2 size={64} className="text-muted-foreground/20 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-2xl font-bold text-white/30">لا يوجد موردين حالياً</p>
                                                <p className="text-sm text-white/10 font-bold uppercase tracking-widest">تأكد من فلاتر البحث</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                suppliers.map((supplier) => (
                                    <TableRow
                                        key={supplier._id}
                                        className="group hover:bg-muted/50 transition-colors h-20 border-white/5 cursor-pointer"
                                        onClick={() => router.push(`/suppliers/${supplier._id}`)}
                                    >
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-lg group-hover:scale-110 transition-transform">
                                                    <AvatarFallback className="bg-gradient-to-tr from-primary to-primary/60 text-white font-bold italic">
                                                        {supplier.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                                                        {supplier.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant={supplier.isActive ? "secondary" : "destructive"}
                                                            className="text-xs h-4 font-bold"
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
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
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
                                            <SupplierBalanceCell balance={supplier.balance || 0} />
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(supplier); }}
                                                    className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                                    title="تعديل"
                                                    aria-label="تعديل"
                                                >
                                                    <FileEdit size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-success/10 text-success transition-all"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedSupplier(supplier); setIsDebtOpen(true); }}
                                                    title="إدارة الديون"
                                                    aria-label="إدارة الديون"
                                                >
                                                    <Wallet size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-info/10 text-info transition-all"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/purchase-orders?supplierId=${supplier._id}`); }}
                                                    title="سجل المشتريات"
                                                    aria-label="سجل المشتريات"
                                                >
                                                    <History size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(supplier._id); }}
                                                    title="حذف"
                                                    aria-label="حذف"
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
            <SupplierDebtManager
                open={isDebtOpen}
                supplier={selectedSupplier}
                onOpenChange={setIsDebtOpen}
            />

            <ConfirmDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                title="حذف المورد"
                description="هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء."
                confirmLabel="حذف"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}

// SupplierBalanceCell — clearly distinguishes "we owe them" (positive
// balance, payable) from "they owe us" (negative balance, receivable),
// shows zero as a neutral dashed badge, and labels the bucket in Arabic
// so the column is self-explanatory without hovering.
function SupplierBalanceCell({ balance }) {
    if (!balance) {
        return (
            <Badge variant="outline" className="font-bold border-dashed border-2 text-muted-foreground">
                0.00 ج.م
            </Badge>
        );
    }

    if (balance > 0) {
        return (
            <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 font-bold text-white bg-rose-600 px-3 py-1.5 rounded-xl border border-rose-700 text-xs shadow-sm">
                    <Wallet className="h-3.5 w-3.5" />
                    <span className="font-mono">{balance.toLocaleString()}</span>
                    <span className="text-xs opacity-90 italic">ج.م</span>
                </div>
                <span className="text-xs text-rose-700 font-bold uppercase tracking-tighter">مستحق للمورد</span>
            </div>
        );
    }

    // Negative — the business is owed by the supplier
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 font-bold text-white bg-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-700 text-xs shadow-sm">
                <Wallet className="h-3.5 w-3.5" />
                <span className="font-mono">{Math.abs(balance).toLocaleString()}</span>
                <span className="text-xs opacity-90 italic">ج.م</span>
            </div>
            <span className="text-xs text-emerald-700 font-bold uppercase tracking-tighter">مستحق لنا عند المورد</span>
        </div>
    );
}

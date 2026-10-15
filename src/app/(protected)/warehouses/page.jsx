'use client';

import { useState } from 'react';
import { useWarehouses, useAddWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '@/hooks/useWarehouses';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { WarehouseFormDialog } from '@/components/warehouses/WarehouseFormDialog';
import { WarehouseDeleteDialog } from '@/components/warehouses/WarehouseDeleteDialog';
import {
    Search,
    Plus,
    FileEdit,
    Trash2,
    Loader2,
    Warehouse as WarehouseIcon,
    MapPin,
    Activity,
    Star,
    RefreshCcw,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils';
import { ROLES } from '@/lib/permissions';

export default function WarehousesPage() {
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    const { role } = useUserRole();
    const canManage = role === ROLES.OWNER || role === ROLES.MANAGER;

    const { data, isLoading, isFetching, isError, error, refetch } = useWarehouses({ search });
    const warehouses = data?.warehouses || [];

    const addMutation = useAddWarehouse();
    const updateMutation = useUpdateWarehouse();
    const deleteMutation = useDeleteWarehouse();

    const handleAddClick = () => {
        setSelected(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (warehouse) => {
        setSelected(warehouse);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (warehouse) => {
        setSelected(warehouse);
        setIsDeleteOpen(true);
    };

    const handleFormSubmit = (formData) => {
        if (addMutation.isPending || updateMutation.isPending) return;
        if (selected) {
            updateMutation.mutate(
                { id: selected._id, data: formData },
                { onSuccess: () => { setIsFormOpen(false); setSelected(null); } }
            );
        } else {
            addMutation.mutate(formData, { onSuccess: () => setIsFormOpen(false) });
        }
    };

    const handleDeleteConfirm = (payload) => {
        if (!selected) return;
        deleteMutation.mutate(
            { id: selected._id, payload },
            { onSuccess: () => { setIsDeleteOpen(false); setSelected(null); } }
        );
    };

    const activeCount = warehouses.filter((w) => w.isActive).length;
    const additionalCount = warehouses.filter((w) => !w.isPrimary).length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            <PageHeader
                title="إدارة المخازن"
                subtitle="المخزن الرئيسي والمخازن الإضافية وتوزيع المخزون"
                icon={WarehouseIcon}
                actions={
                    canManage && (
                        <Button
                            onClick={handleAddClick}
                            data-testid="add-warehouse-button"
                            className="h-14 px-8 rounded-2xl font-bold text-lg gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 bg-primary text-primary-foreground"
                        >
                            <Plus size={24} />
                            إضافة مخزن
                        </Button>
                    )
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard title="إجمالي المخازن" value={warehouses.length} icon={WarehouseIcon} variant="primary" />
                <KPICard title="مخازن نشطة" value={activeCount} icon={Activity} variant="success" />
                <KPICard title="مخازن إضافية" value={additionalCount} icon={Star} variant="secondary" />
            </div>

            <div className="relative group">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary h-6 w-6" />
                <Input
                    placeholder="ابحث باسم أو كود المخزن..."
                    data-testid="warehouse-search-input"
                    className="h-16 pr-16 pl-8 rounded-[2rem] bg-card/40 border-white/10 focus:bg-card/60 focus:border-primary/50 transition-all font-bold text-xl placeholder:text-muted-foreground/30 shadow-2xl backdrop-blur-xl ring-0 focus-visible:ring-0"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                        <h2 className="text-2xl font-bold tracking-tight">قائمة المخازن</h2>
                        <span className="text-xs text-muted-foreground font-bold">({warehouses.length} مخزن)</span>
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
                        <RefreshCcw className={cn('h-5 w-5 text-muted-foreground', isFetching && 'animate-spin text-primary')} />
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <Table aria-label="قائمة المخازن">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/5 h-16 bg-white/[0.01]">
                                <TableHead className="font-bold text-white/40 uppercase tracking-widest text-xs px-8 text-right">المخزن</TableHead>
                                <TableHead className="font-bold text-white/40 uppercase tracking-widest text-xs px-8 text-right">الكود</TableHead>
                                <TableHead className="font-bold text-white/40 uppercase tracking-widest text-xs px-8 text-right">العنوان</TableHead>
                                <TableHead className="font-bold text-white/40 uppercase tracking-widest text-xs px-8 text-center">الحالة</TableHead>
                                {canManage && (
                                    <TableHead className="font-bold text-white/40 uppercase tracking-widest text-xs px-8 text-center">الإجراءات</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isError ? (
                                <TableRow>
                                    <TableCell colSpan={canManage ? 5 : 4} className="h-72 text-center border-none">
                                        <div className="flex flex-col items-center gap-6">
                                            <AlertCircle size={56} className="text-destructive" />
                                            <p className="text-xl font-bold text-destructive">تعذر تحميل قائمة المخازن</p>
                                            <p className="text-sm text-muted-foreground">{error?.message}</p>
                                            <Button onClick={() => refetch()} variant="outline" className="gap-2">
                                                <RefreshCcw className="h-4 w-4" /> إعادة المحاولة
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={canManage ? 5 : 4} className="h-72 text-center border-none">
                                        <Loader2 size={56} className="text-primary animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : warehouses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={canManage ? 5 : 4} className="h-72 text-center border-none">
                                        <div className="flex flex-col items-center gap-4">
                                            <WarehouseIcon size={56} className="text-muted-foreground/20" />
                                            <p className="text-xl font-bold text-white/30">لا توجد مخازن</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                warehouses.map((warehouse) => (
                                    <TableRow key={warehouse._id} className="group hover:bg-muted/50 transition-colors h-20 border-white/5">
                                        <TableCell className="px-8">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <WarehouseIcon className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground text-sm flex items-center gap-2">
                                                        {warehouse.name}
                                                        {warehouse.isPrimary && (
                                                            <Badge variant="secondary" className="text-xs h-5 gap-1">
                                                                <Star className="w-3 h-3" /> رئيسي
                                                            </Badge>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 font-mono text-sm text-muted-foreground">{warehouse.code}</TableCell>
                                        <TableCell className="px-8 text-sm text-muted-foreground">
                                            {warehouse.address ? (
                                                <span className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-primary" />
                                                    {warehouse.address}
                                                </span>
                                            ) : (
                                                <span className="opacity-30">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-8 text-center">
                                            <Badge variant={warehouse.isActive ? 'secondary' : 'destructive'} className="text-xs font-bold">
                                                {warehouse.isActive ? 'نشط' : 'معطل'}
                                            </Badge>
                                        </TableCell>
                                        {canManage && (
                                            <TableCell className="px-8">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditClick(warehouse)}
                                                        className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                                        title="تعديل"
                                                        aria-label="تعديل"
                                                    >
                                                        <FileEdit size={16} />
                                                    </Button>
                                                    {!warehouse.isPrimary && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteClick(warehouse)}
                                                            className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                                                            title="حذف"
                                                            aria-label="حذف"
                                                            data-testid="delete-warehouse-button"
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <WarehouseFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setSelected(null);
                }}
                mode={selected ? 'edit' : 'add'}
                initialData={selected}
                onSubmit={handleFormSubmit}
                isPending={addMutation.isPending || updateMutation.isPending}
            />

            <WarehouseDeleteDialog
                open={isDeleteOpen}
                onOpenChange={(open) => {
                    setIsDeleteOpen(open);
                    if (!open) setSelected(null);
                }}
                warehouse={selected}
                onConfirm={handleDeleteConfirm}
                isPending={deleteMutation.isPending}
            />
        </div>
    );
}

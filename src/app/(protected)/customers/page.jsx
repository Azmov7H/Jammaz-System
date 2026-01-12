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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { Search, Plus, FileEdit, Trash2, Phone, MapPin, Loader2, Wallet, Users, AlertTriangle, ArrowRightLeft, Activity } from 'lucide-react';
import { cn } from '@/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { KPICard } from '@/components/dashboard/KPICard';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';

export default function CustomersPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const { data: queryData, isLoading, addMutation, updateMutation, deleteMutation } = useCustomers({ search });
    const customers = queryData?.customers || [];

    const handleEditClick = (customer) => {
        setSelectedCustomer(customer);
        setIsEditOpen(true);
    };



    const handleFormSubmit = (formData) => {
        const payload = {
            ...formData,
            creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0
        };

        if (selectedCustomer) {
            updateMutation.mutate({ id: selectedCustomer._id, data: payload }, {
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedCustomer(null);
                }
            });
        } else {
            addMutation.mutate(payload, {
                onSuccess: () => {
                    setIsAddOpen(false);
                }
            });
        }
    };



    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من تعطيل حساب هذا العميل؟')) {
            deleteMutation.mutate(id);
        }
    };

    // Stats
    const activeCustomers = customers.filter(c => c.isActive).length;
    const debtCustomers = customers.filter(c => c.balance > 0).length;
    const creditCustomers = customers.filter(c => c.creditBalance > 0).length;
    const inactiveCustomers = customers.filter(c => {
        if (!c.lastPurchaseDate) return false;
        const diff = (new Date() - new Date(c.lastPurchaseDate)) / (1000 * 60 * 60 * 24);
        return diff > 30;
    }).length;


    return (
        <div className="space-y-8 animate-fade-in-up" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <Users className="text-primary w-8 h-8" />
                        إدارة العملاء
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">قائمة العملاء وبيانات الاتصال والأسعار المخصصة</p>
                </div>
                <Button
                    onClick={() => { setSelectedCustomer(null); setIsAddOpen(true); }}
                    className="h-14 px-8 rounded-2xl font-black gap-2 gradient-primary border-0 shadow-colored hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" /> إضافة عميل جديد
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <KPICard title="إجمالي العملاء" value={customers.length} unit="" icon={Users} variant="default" />
                <KPICard title="نشط" value={activeCustomers} unit="" icon={Activity} variant="success" />
                <KPICard title="مديونية" value={debtCustomers} unit="" icon={Wallet} variant="destructive" />
                <KPICard title="رصيد" value={creditCustomers} unit="" icon={ArrowRightLeft} variant="primary" />
                <KPICard title="غير نشط" value={inactiveCustomers} unit="" icon={AlertTriangle} variant="warning" />
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Search className="h-5 w-5" />
                </div>
                <Input
                    placeholder="بحث باسم العميل، العنوان، أو رقم الهاتف..."
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
                            <TableHead className="font-black text-xs uppercase tracking-widest text-right px-6">العميل / الحالة</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-widest text-right">الاتصال</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-widest text-center">نوع السعر</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-widest text-center">الرصيد</TableHead>
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
                        ) : customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center text-muted-foreground font-bold">
                                    <div className="flex flex-col items-center gap-4 opacity-50">
                                        <Users className="w-16 h-16" />
                                        <p>لا يوجد عملاء مطابقين للبحث</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer) => {
                                // Calculate inactivity
                                const lastPurchase = customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate) : null;
                                const daysSinceLast = lastPurchase ? Math.floor((new Date() - lastPurchase) / (1000 * 60 * 60 * 24)) : null;
                                const isInactive = daysSinceLast !== null && daysSinceLast > 30;

                                return (
                                    <TableRow key={customer._id} className="group hover:bg-muted/50 transition-colors h-20 border-white/5">
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-lg group-hover:scale-110 transition-transform">
                                                    <AvatarFallback className="bg-gradient-to-tr from-primary to-primary/60 text-white font-black">
                                                        {customer.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-foreground text-sm group-hover:text-primary transition-colors">{customer.name}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant={customer.isActive ? "secondary" : "destructive"}
                                                            className="text-[10px] h-4 font-black"
                                                        >
                                                            {customer.isActive ? 'نشط' : 'متوقف'}
                                                        </Badge>
                                                        {isInactive && (
                                                            <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border-none text-[10px] h-4 font-black">
                                                                منقطع ({daysSinceLast} يوم)
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                                    <Phone size={12} className="text-primary" />
                                                    <span className="font-mono">{customer.phone}</span>
                                                </div>
                                                {customer.address && (
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                                                        <MapPin size={10} />
                                                        <span className="truncate max-w-[150px]">{customer.address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "font-bold py-1 px-3 border-2 transition-all",
                                                    customer.priceType === 'wholesale' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                                                    customer.priceType === 'special' && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                                                    customer.priceType === 'retail' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                )}
                                            >
                                                {customer.priceType === 'wholesale' ? '🏪 جملة' :
                                                    customer.priceType === 'special' ? '⭐ خاص' : '🛒 قطاعي'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                {customer.balance > 0 ? (
                                                    <div className="flex items-center gap-2 font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20 text-xs">
                                                        <span className="font-mono">{customer.balance?.toLocaleString()}</span>
                                                        <span className="text-[10px] opacity-70">دين</span>
                                                    </div>
                                                ) : null}
                                                {customer.creditBalance > 0 ? (
                                                    <div className="flex items-center gap-2 font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 text-xs">
                                                        <span className="font-mono">{customer.creditBalance?.toLocaleString()}</span>
                                                        <span className="text-[10px] opacity-70">رصيد</span>
                                                    </div>
                                                ) : null}
                                                {(!customer.balance && !customer.creditBalance) && (
                                                    <Badge variant="outline" className="opacity-50 font-bold border-dashed border-2">بدون رصيد</Badge>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center px-6">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(customer); }}
                                                    className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                                    title="تعديل"
                                                >
                                                    <FileEdit size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-blue-500/10 text-blue-500 transition-all"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/receivables?customerId=${customer._id}`); }}
                                                    title="سجل الديون"
                                                >
                                                    <Wallet size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(customer._id); }}
                                                    title="حذف"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialogs */}
            <CustomerFormDialog
                open={isAddOpen || isEditOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddOpen(false);
                        setIsEditOpen(false);
                        setSelectedCustomer(null);
                    }
                }}
                mode={isEditOpen ? 'edit' : 'add'}
                initialData={selectedCustomer}
                onSubmit={handleFormSubmit}
                isPending={addMutation.isPending || updateMutation.isPending}
            />


        </div>
    );
}

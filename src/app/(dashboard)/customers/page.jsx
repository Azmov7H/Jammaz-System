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
import { Search, Plus, FileEdit, Trash2, Phone, MapPin, Loader2, Wallet, User as UserIcon, Gift, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { KPICard } from '@/components/dashboard/KPICard';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { RedeemPointsDialog } from '@/components/customers/RedeemPointsDialog';

export default function CustomersPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isRedeemOpen, setIsRedeemOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const { data: queryData, isLoading, addMutation, updateMutation, deleteMutation, redeemMutation } = useCustomers({ search });
    const customers = queryData?.customers || [];

    const handleEditClick = (customer) => {
        setSelectedCustomer(customer);
        setIsEditOpen(true);
    };

    const handleRedeemClick = (customer) => {
        setSelectedCustomer(customer);
        setIsRedeemOpen(true);
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

    const handleRedeemSubmit = ({ id, points }) => {
        redeemMutation.mutate({ id, points }, {
            onSuccess: () => setIsRedeemOpen(false)
        });
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
    const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
    const inactiveCustomers = customers.filter(c => {
        if (!c.lastPurchaseDate) return false;
        const diff = (new Date() - new Date(c.lastPurchaseDate)) / (1000 * 60 * 60 * 24);
        return diff > 30;
    }).length;


    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="animate-slide-in-right">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">إدارة العملاء</h1>
                    <p className="text-muted-foreground">قائمة العملاء وبيانات الاتصال والأسعار ونقاط الولاء</p>
                </div>
                <Button onClick={() => { setSelectedCustomer(null); setIsAddOpen(true); }} className="gap-2 gradient-primary border-0 hover-lift shadow-colored animate-scale-in">
                    <Plus size={16} /> إضافة عميل جديد
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative glass-card p-4 rounded-lg border shadow-custom-md hover-lift transition-all duration-300 group">
                <Search className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors duration-300" size={18} />
                <Input
                    placeholder="بحث باسم العميل أو رقم الهاتف..."
                    className="pr-10 max-w-md bg-transparent border-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <KPICard title="إجمالي العملاء" value={customers.length} unit="" icon={UserIcon} variant="default" />
                <KPICard title="عملاء نشطون" value={activeCustomers} unit="" icon={UserIcon} variant="success" />
                <KPICard title="في انتظار السداد" value={debtCustomers} unit="" icon={Wallet} variant="destructive" />
                <KPICard title="رصيد مرتجع" value={creditCustomers} unit="" icon={ArrowRightLeft} variant="primary" />
                <KPICard title="نقاط الولاء" value={totalPoints.toLocaleString()} unit="" icon={Gift} variant="warning" />
                <KPICard title="منقطعون" value={inactiveCustomers} unit="" icon={AlertTriangle} variant="destructive" />
            </div>

            {/* Table */}
            <div className="border rounded-lg glass-card shadow-custom-md overflow-hidden hover-lift transition-all duration-300">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[200px]">العميل / الحالة</TableHead>
                            <TableHead className="min-w-[180px]">معلومات الاتصال</TableHead>
                            <TableHead className="text-center">نوع السعر</TableHead>
                            <TableHead className="text-center min-w-[120px]">الرصيد المالي</TableHead>
                            <TableHead className="text-center">نقاط الولاء</TableHead>
                            <TableHead className="text-center min-w-[140px]">إجراءات</TableHead>
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
                            customers.map((customer) => {
                                // Calculate inactivity
                                const lastPurchase = customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate) : null;
                                const daysSinceLast = lastPurchase ? Math.floor((new Date() - lastPurchase) / (1000 * 60 * 60 * 24)) : null;
                                const isInactive = daysSinceLast !== null && daysSinceLast > 30;

                                return (
                                    <TableRow key={customer._id} className="transition-all duration-300 hover:bg-muted/50 cursor-pointer group hover:shadow-sm">
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="font-semibold flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-colored group-hover:scale-110 transition-transform duration-300">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="group-hover:text-primary transition-colors">{customer.name}</span>
                                                        <div className="flex gap-1">
                                                            <Badge
                                                                variant={customer.isActive ? "secondary" : "destructive"}
                                                                className="text-[10px] h-4 px-1"
                                                            >
                                                                {customer.isActive ? 'نشط' : 'متوقف'}
                                                            </Badge>
                                                            {isInactive && (
                                                                <Badge variant="destructive" className="bg-rose-500 text-[10px] h-4 px-1 animate-pulse">
                                                                    <AlertTriangle size={8} className="ml-1" /> منقطع ({daysSinceLast} يوم)
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                    <div className="p-1 bg-primary/10 rounded group-hover:bg-primary/20 transition-colors">
                                                        <Phone size={12} className="text-primary" />
                                                    </div>
                                                    <span className="font-mono">{customer.phone}</span>
                                                </div>
                                                {customer.address && (
                                                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                                        <div className="p-1 bg-muted rounded">
                                                            <MapPin size={10} />
                                                        </div>
                                                        <span className="line-clamp-1">{customer.address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "shadow-sm hover-scale transition-all",
                                                    customer.priceType === 'wholesale' && "bg-blue-50 text-blue-700 border-blue-300",
                                                    customer.priceType === 'special' && "bg-purple-50 text-purple-700 border-purple-300",
                                                    customer.priceType === 'retail' && "bg-green-50 text-green-700 border-green-300"
                                                )}
                                            >
                                                {customer.priceType === 'wholesale' ? '🏪 جملة' :
                                                    customer.priceType === 'special' ? '⭐ خاص' : '🛒 قطاعي'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                {customer.balance > 0 ? (
                                                    <div className="w-full max-w-[140px] flex items-center justify-between gap-2 font-black text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm">
                                                        <Wallet size={14} className="shrink-0" />
                                                        <span className="font-mono text-sm">{customer.balance?.toLocaleString()}</span>
                                                        <span className="text-[10px] opacity-70">دين</span>
                                                    </div>
                                                ) : null}
                                                {customer.creditBalance > 0 ? (
                                                    <div className="w-full max-w-[140px] flex items-center justify-between gap-2 font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                                                        <ArrowRightLeft size={14} className="shrink-0" />
                                                        <span className="font-mono text-sm">{customer.creditBalance?.toLocaleString()}</span>
                                                        <span className="text-[10px] opacity-70">رصيد</span>
                                                    </div>
                                                ) : null}
                                                {(!customer.balance && !customer.creditBalance) && (
                                                    <span className="text-muted-foreground text-[10px] italic bg-slate-50 px-2 py-1 rounded">خالص</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-2 font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full border border-amber-200">
                                                    <Gift size={14} />
                                                    <span className="font-mono">{customer.loyaltyPoints || 0}</span>
                                                </div>
                                                {(customer.loyaltyPoints > 0) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-[10px] text-amber-700 hover:bg-amber-100"
                                                        onClick={(e) => { e.stopPropagation(); handleRedeemClick(customer); }}
                                                    >
                                                        استبدال النقاط
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-all">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(customer); }}
                                                    className="hover-scale hover:bg-primary/10 hover:text-primary"
                                                    title="تعديل"
                                                >
                                                    <FileEdit size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover-scale text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/receivables?customerId=${customer._id}`); }}
                                                    title="سجل الديون"
                                                >
                                                    <Wallet size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover-scale text-destructive hover:text-destructive hover:bg-destructive/10"
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

            <RedeemPointsDialog
                open={isRedeemOpen}
                onOpenChange={setIsRedeemOpen}
                customer={selectedCustomer}
                onRedeem={handleRedeemSubmit}
                isPending={redeemMutation.isPending}
            />
        </div>
    );
}

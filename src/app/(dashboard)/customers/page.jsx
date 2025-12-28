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

export default function CustomersPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isRedeemOpen, setIsRedeemOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [redeemPoints, setRedeemPoints] = useState(0);

    const { data: customers = [], isLoading, addMutation, updateMutation, deleteMutation, redeemMutation } = useCustomers({ search });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        priceType: 'retail',
        address: '',
        creditLimit: '',
        notes: '',
        financialTrackingEnabled: true,
        collectionDay: 'None',
        paymentTerms: 0
    });

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            priceType: 'retail',
            address: '',
            creditLimit: '',
            notes: '',
            financialTrackingEnabled: true,
            collectionDay: 'None',
            paymentTerms: 0
        });
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
            notes: customer.notes || '',
            financialTrackingEnabled: customer.financialTrackingEnabled !== undefined ? customer.financialTrackingEnabled : true,
            collectionDay: customer.collectionDay || 'None',
            paymentTerms: customer.paymentTerms || 0
        });
        setIsEditOpen(true);
    };

    const handleRedeemClick = (customer) => {
        setSelectedCustomer(customer);
        setRedeemPoints(customer.loyaltyPoints || 0);
        setIsRedeemOpen(true);
    };

    const handleRedeemSubmit = () => {
        if (redeemPoints <= 0) {
            toast.error('يجب إدخال عدد نقاط أكبر من 0');
            return;
        }
        if (redeemPoints > (selectedCustomer.loyaltyPoints || 0)) {
            toast.error('النقاط المدخلة أكبر من المتاحة للعميل');
            return;
        }

        redeemMutation.mutate({ id: selectedCustomer._id, points: redeemPoints }, {
            onSuccess: () => setIsRedeemOpen(false)
        });
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
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="animate-slide-in-right">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">إدارة العملاء</h1>
                    <p className="text-muted-foreground">قائمة العملاء وبيانات الاتصال والأسعار ونقاط الولاء</p>
                </div>
                <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="gap-2 gradient-primary border-0 hover-lift shadow-colored animate-scale-in">
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
                <div className="glass-card p-4 rounded-lg border shadow-custom-sm hover-lift transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{customers.length}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                            <UserIcon size={24} className="text-primary" />
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4 rounded-lg border shadow-custom-sm hover-lift transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">عملاء نشطون</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {customers.filter(c => c.isActive).length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-lg group-hover:scale-110 transition-transform">
                            <UserIcon size={24} className="text-green-500" />
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4 rounded-lg border shadow-custom-sm hover-lift transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">في انتظار السداد</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {customers.filter(c => c.balance > 0).length}
                            </p>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-lg group-hover:scale-110 transition-transform">
                            <Wallet size={24} className="text-red-500" />
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4 rounded-lg border shadow-custom-sm hover-lift transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">رصيد مرتجع</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {customers.filter(c => c.creditBalance > 0).length}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
                            <ArrowRightLeft size={24} className="text-blue-500" />
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4 rounded-lg border shadow-custom-sm hover-lift transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">نقاط الولاء</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">
                                {customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-lg group-hover:scale-110 transition-transform">
                            <Gift size={24} className="text-amber-500" />
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4 rounded-lg border shadow-custom-sm hover-lift transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">منقطعون</p>
                            <p className="text-2xl font-bold text-rose-600 mt-1">
                                {customers.filter(c => {
                                    if (!c.lastPurchaseDate) return false;
                                    const diff = (new Date() - new Date(c.lastPurchaseDate)) / (1000 * 60 * 60 * 24);
                                    return diff > 30; // Threshold logic 
                                }).length}
                            </p>
                        </div>
                        <div className="p-3 bg-rose-500/10 rounded-lg group-hover:scale-110 transition-transform">
                            <AlertTriangle size={24} className="text-rose-500" />
                        </div>
                    </div>
                </div>
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

            {/* Add/Edit Dialog */}
            <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                    resetForm();
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
                                <Label>حد الائتمان (الديون) <span className="text-[10px] text-primary">(0 = مفتوح)</span></Label>
                                <Input
                                    type="number"
                                    value={formData.creditLimit}
                                    onChange={e => setFormData({ ...formData, creditLimit: e.target.value })}
                                    placeholder="أدخل الحد الأقصى للديون (0 للمفتوح)"
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

                        <Separator />
                        <div className="bg-primary/5 p-4 rounded-xl space-y-4 border border-primary/10">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                <Wallet size={14} /> التحكم في المديونية والتحصيل
                            </h4>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm">تفعيل التتبع المالي</Label>
                                    <p className="text-[10px] text-muted-foreground">توليد إشعارات تحصيل لهذا العميل</p>
                                </div>
                                <Switch
                                    checked={formData.financialTrackingEnabled}
                                    onCheckedChange={checked => setFormData({ ...formData, financialTrackingEnabled: checked })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">يوم التحصيل المفضل</Label>
                                    <Select
                                        value={formData.collectionDay}
                                        onValueChange={val => setFormData({ ...formData, collectionDay: val })}
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
                                    <Label className="text-xs">فترة السداد الخاصة (يوم)</Label>
                                    <Input
                                        type="number"
                                        className="h-9 text-xs"
                                        value={formData.paymentTerms}
                                        onChange={e => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 0 })}
                                        placeholder="0 = الافتراضي"
                                    />
                                </div>
                            </div>
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

            {/* Loyalty Redemption Dialog */}
            <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Gift className="text-amber-500" /> استبدال نقاط الولاء ({selectedCustomer?.name})
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-6 text-center">
                        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 inline-block mx-auto min-w-[200px]">
                            <p className="text-amber-700 text-sm font-bold mb-2">النقاط المتاحة</p>
                            <p className="text-4xl font-black text-amber-600">{selectedCustomer?.loyaltyPoints || 0}</p>
                        </div>

                        <div className="space-y-3 px-4">
                            <Label className="text-right block">عدد النقاط المراد استبدالها</Label>
                            <Input
                                type="number"
                                className="text-center text-xl font-bold h-12"
                                value={redeemPoints}
                                onChange={(e) => setRedeemPoints(parseInt(e.target.value) || 0)}
                            />
                            <p className="text-[10px] text-muted-foreground">سيتم تحويل النقاط إلى رصيد مالي في حساب العميل مباشرة</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsRedeemOpen(false)}>إلغاء</Button>
                        <Button
                            className="bg-amber-500 hover:bg-amber-600 border-0"
                            onClick={handleRedeemSubmit}
                            disabled={redeemMutation.isPending}
                        >
                            {redeemMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            تأكيد الاستبدال
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

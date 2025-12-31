'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, TrendingDown, TrendingUp, AlertCircle,
    CheckCircle2, Clock, Calendar, Users, Building2,
    ArrowUpRight, ArrowDownRight, Filter, Search,
    FileText, MoreHorizontal, ChevronRight, Activity,
    ShieldAlert, BadgePercent, ArrowRightLeft, Loader2,
    Banknote, CreditCard, DollarSign, Settings, Save, BellRing,
    CalendarPlus, Trash2, PlusCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function DebtCenterPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Settlement State
    const [isSettlementOpen, setIsSettlementOpen] = useState(false);
    const [settlementType, setSettlementType] = useState('receivable'); // receivable or payable
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [settlementAmount, setSettlementAmount] = useState('');
    const [settlementMethod, setSettlementMethod] = useState('cash');
    const [settlementNote, setSettlementNote] = useState('');

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState({
        supplierPaymentAlertDays: 3,
        customerCollectionAlertDays: 3,
        defaultSupplierTerms: 30,
        minDebtNotificationAmount: 10
    });

    const { data: settingsData } = useQuery({
        queryKey: ['invoice-settings'],
        queryFn: async () => {
            const res = await fetch('/api/settings/invoice-design');
            if (!res.ok) throw new Error('Failed to fetch settings');
            return res.json();
        },
    });

    // Sync settings form when data loads
    useMemo(() => {
        if (settingsData) {
            setSettingsForm(prev => ({
                ...prev,
                supplierPaymentAlertDays: settingsData.supplierPaymentAlertDays || 3,
                customerCollectionAlertDays: settingsData.customerCollectionAlertDays || 3,
                defaultSupplierTerms: settingsData.defaultSupplierTerms || 30,
                minDebtNotificationAmount: settingsData.minDebtNotificationAmount || 10
            }));
        }
    }, [settingsData]);

    const settingsMutation = useMutation({
        mutationFn: async (data) => {
            const res = await fetch('/api/settings/invoice-design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to save settings');
            return res.json();
        },
        onSuccess: () => {
            toast.success('تم حفظ إعدادات الديون بنجاح');
            setIsSettingsOpen(false);
            queryClient.invalidateQueries(['invoice-settings']);
        },
        onError: (err) => toast.error(err.message)
    });

    // Schedule State
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [scheduleRows, setScheduleRows] = useState([]);

    // Fetch schedules for selected entity
    const { data: scheduleData } = useQuery({
        queryKey: ['schedules', selectedEntity?._id],
        queryFn: async () => {
            if (!selectedEntity) return null;
            const res = await fetch(`/api/financial/schedule?entityId=${selectedEntity._id}&entityType=${settlementType === 'receivable' ? 'Customer' : 'Supplier'}`);
            if (!res.ok) throw new Error('Failed to fetch schedules');
            return res.json();
        },
        enabled: !!selectedEntity && isScheduleOpen
    });

    // Sync active schedules to rows
    useMemo(() => {
        if (scheduleData?.schedules) {
            setScheduleRows(scheduleData.schedules.map(s => ({
                amount: s.amount,
                dueDate: format(new Date(s.dueDate), 'yyyy-MM-dd'),
                notes: s.notes || ''
            })));
        } else {
            setScheduleRows([]);
        }
    }, [scheduleData]);

    const scheduleMutation = useMutation({
        mutationFn: async (data) => {
            const res = await fetch('/api/financial/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to save schedule');
            return result;
        },
        onSuccess: () => {
            toast.success('تمت جدولة الدفعات بنجاح');
            setIsScheduleOpen(false);
            queryClient.invalidateQueries(['schedules']);
        },
        onError: (err) => toast.error(err.message)
    });

    const handleOpenSchedule = (entity, type) => {
        if (!entity || !entity._id) {
            toast.error('بيانات العميل/المورد غير مكتملة (Missing ID). يرجى تحديث الصفحة.');
            return;
        }
        setSettlementType(type);
        setSelectedEntity(entity);
        setIsScheduleOpen(true);
    };

    const addScheduleRow = () => {
        setScheduleRows([...scheduleRows, { amount: '', dueDate: '', notes: '' }]);
    };

    const updateScheduleRow = (index, field, value) => {
        const newRows = [...scheduleRows];
        newRows[index][field] = value;
        setScheduleRows(newRows);
    };

    const removeScheduleRow = (index) => {
        const newRows = [...scheduleRows];
        newRows.splice(index, 1);
        setScheduleRows(newRows);
    };

    const saveSchedule = () => {
        if (scheduleRows.length === 0) return;
        scheduleMutation.mutate({
            entityId: selectedEntity._id,
            entityType: settlementType === 'receivable' ? 'Customer' : 'Supplier',
            schedules: scheduleRows.filter(r => r.amount && r.dueDate)
        });
    };

    const calculateScheduledTotal = () => scheduleRows.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    const { data: overview, isLoading } = useQuery({
        queryKey: ['debt-overview'],
        queryFn: async () => {
            const res = await fetch('/api/financial/debt-overview');
            if (!res.ok) throw new Error('Failed to fetch data');
            return res.json();
        }
    });

    const settlementMutation = useMutation({
        mutationFn: async (data) => {
            const res = await fetch('/api/financial/settle-debt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to process settlement');
            return result;
        },
        onSuccess: () => {
            toast.success('تمت العملية بنجاح', {
                description: settlementType === 'receivable' ? 'تم تحصيل الدفعة بنجاح' : 'تم سداد المستحقات بنجاح',
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            });
            setIsSettlementOpen(false);
            setSettlementAmount('');
            setSettlementNote('');
            queryClient.invalidateQueries(['debt-overview']);
        },
        onError: (err) => toast.error(err.message)
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="p-4 rounded-3xl bg-primary/10 text-primary"
                >
                    <Activity size={40} />
                </motion.div>
                <p className="font-black text-muted-foreground animate-pulse">جاري تحليل الموقف المالي للمؤسسة...</p>
            </div>
        );
    }

    const { receivables, payables, totalNet, liquidityPulse, riskScore } = overview;

    const openSettlement = (entity, type) => {
        setSettlementType(type);
        setSelectedEntity(entity);
        const suggested = type === 'receivable' ? entity.invoices[0] : entity.pos[0];
        setSettlementAmount(type === 'receivable' ? suggested.balance : suggested.totalCost - (suggested.paidAmount || 0));
        setIsSettlementOpen(true);
    };

    const handleSettlement = () => {
        const target = settlementType === 'receivable' ? selectedEntity.invoices[0] : selectedEntity.pos[0];
        settlementMutation.mutate({
            type: settlementType,
            id: target._id,
            amount: parseFloat(settlementAmount),
            method: settlementMethod,
            note: settlementNote
        });
    };

    return (
        <div className="min-h-screen space-y-8 pb-20" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20">
                            <ShieldAlert className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight">مركز إدارة المديونيات</h1>
                            <p className="text-muted-foreground font-bold">نظام الرقابة المالية المتكامل والمتابعة الذكية</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" className="h-12 px-4 rounded-2xl border-white/10 hover:bg-white/5 gap-2" onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="w-5 h-5" />
                        <span className="hidden md:inline font-bold">إعدادات الديون</span>
                    </Button>
                    <Badge className={cn(
                        "h-12 px-6 rounded-2xl font-black text-sm flex gap-2 items-center",
                        riskScore === 'CRITICAL' ? "bg-rose-500/20 text-rose-500 border-rose-500/20" :
                            riskScore === 'WARNING' ? "bg-amber-500/20 text-amber-500 border-amber-500/20" :
                                "bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                    )} variant="outline">
                        <Activity size={16} />
                        المؤشر العام: {riskScore === 'CRITICAL' ? 'حرج' : riskScore === 'WARNING' ? 'تنبيه' : 'آمن'}
                    </Badge>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'إجمالي الديون (لنا)', value: receivables.total, icon: TrendingUp, color: 'emerald', sub: `${receivables.byCustomer.length} عميل مديون` },
                    { label: 'إجمالي الالتزامات (علينا)', value: payables.total, icon: TrendingDown, color: 'rose', sub: `${payables.bySupplier.length} مورد دائن` },
                    { label: 'الصافي المالي', value: totalNet, icon: ArrowRightLeft, color: totalNet >= 0 ? 'primary' : 'rose', sub: totalNet >= 0 ? 'فائض مديونية' : 'عجز مديونية' },
                    { label: 'نبض السيولة', value: liquidityPulse, icon: Activity, color: parseFloat(liquidityPulse) >= 1 ? 'emerald' : 'amber', sub: 'نسبة التحصيل للمدفوعات', isRaw: true },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Card className="glass-card border-0 shadow-custom-xl overflow-hidden rounded-[2.5rem] h-full group">
                            <CardContent className="p-8 relative">
                                <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 bg-gradient-to-br transition-all duration-500 group-hover:opacity-10", `from-${stat.color}-500 to-transparent`)} />
                                <div className="flex items-start justify-between mb-6">
                                    <div className={cn("p-4 rounded-2xl", `bg-${stat.color}-500/10`)}>
                                        <stat.icon className={cn("w-6 h-6", `text-${stat.color}-500`)} />
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase opacity-40">Financial</Badge>
                                </div>
                                <h3 className="text-sm font-bold text-muted-foreground mb-1">{stat.label}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black tracking-tighter">{stat.isRaw ? stat.value : stat.value.toLocaleString()}</span>
                                    {!stat.isRaw && <span className="text-sm font-black text-muted-foreground">ج.م</span>}
                                </div>
                                <p className="text-xs font-bold mt-2 text-muted-foreground/60">{stat.sub}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-white/5 p-1 rounded-2xl border border-white/10 h-14 w-full md:w-auto">
                    <TabsTrigger value="overview" className="rounded-xl px-8 font-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">نظرة عامة (Aging)</TabsTrigger>
                    <TabsTrigger value="receivables" className="rounded-xl px-8 font-black">ديون العملاء</TabsTrigger>
                    <TabsTrigger value="payables" className="rounded-xl px-8 font-black">مستحقات الموردين</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Receivables Aging */}
                        <Card className="glass-card border-0 shadow-custom-xl rounded-[3rem] p-10 space-y-8 overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black flex items-center gap-3"><TrendingUp className="text-emerald-500" /> عجز التحصيل</h3>
                                <Badge className="bg-emerald-500/10 text-emerald-500 font-black">Aging Analysis</Badge>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { label: 'جارية (0-30 يوم)', amount: receivables.tiers.current.amount, color: 'primary' },
                                    { label: 'متأخرات (30+ يوم)', amount: receivables.tiers.tier1.amount, color: 'amber' },
                                    { label: 'ديون هالكة (60+ يوم)', amount: receivables.tiers.tier2.amount + receivables.tiers.tier3.amount, color: 'rose' },
                                ].map((tier, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between font-black"><span>{tier.label}</span><span>{tier.amount.toLocaleString()} ج.م</span></div>
                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${(tier.amount / (receivables.total || 1)) * 100}%` }} className={cn("h-full rounded-full", `bg-${tier.color}-500`)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Payables Aging */}
                        <Card className="glass-card border-0 shadow-custom-xl rounded-[3rem] p-10 space-y-8 overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black flex items-center gap-3"><TrendingDown className="text-rose-500" /> مديونية الموردين</h3>
                                <Badge className="bg-rose-500/10 text-rose-500 font-black">Payable Pipeline</Badge>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { label: 'فواتير قيد السداد', amount: payables.tiers.current.amount, color: 'primary' },
                                    { label: 'متأخرات (قريبة)', amount: payables.tiers.tier1.amount, color: 'amber' },
                                    { label: 'ديون حرجة', amount: payables.tiers.tier2.amount + payables.tiers.tier3.amount, color: 'rose' },
                                ].map((tier, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between font-black"><span>{tier.label}</span><span>{tier.amount.toLocaleString()} ج.م</span></div>
                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${(tier.amount / (payables.total || 1)) * 100}%` }} className={cn("h-full rounded-full", `bg-${tier.color}-500`)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="receivables" className="space-y-4">
                    <div className="glass-card p-4 h-16 rounded-2xl flex items-center gap-4 border border-white/10 mb-6">
                        <Search className="text-muted-foreground" />
                        <Input placeholder="بحث باسم العميل..." className="border-0 bg-transparent h-full text-lg focus-visible:ring-0" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    {receivables.byCustomer.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((c, i) => (
                        <Card key={i} className="glass-card p-6 border-white/5 hover:border-emerald-500/20 transition-all rounded-[2rem]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-xl">{c.name.charAt(0)}</div>
                                    <div><h4 className="text-xl font-black">{c.name}</h4><Badge variant="outline" className="text-[10px] opacity-60">{c.invoices.length} فواتير آيلة للتحصيل</Badge></div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-left"><p className="text-[10px] font-bold opacity-40 uppercase">إجمالي المديونية</p><p className="text-3xl font-black text-rose-500 font-mono">{c.totalDebt.toLocaleString()}</p></div>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handleOpenSchedule(c, 'receivable')} variant="outline" className="h-14 px-4 rounded-2xl border-white/10 hover:bg-white/5" title="جدولة الدفعات">
                                            <CalendarPlus className="w-5 h-5 text-emerald-500" />
                                        </Button>
                                        <div className="flex items-center gap-2">
                                            <Button onClick={() => handleOpenSchedule(c, 'receivable')} variant="outline" className="h-14 px-4 rounded-2xl border-white/10 hover:bg-white/5" title="جدولة الدفعات">
                                                <CalendarPlus className="w-5 h-5 text-emerald-500" />
                                            </Button>
                                            <Button onClick={() => openSettlement(c, 'receivable')} className="h-14 px-8 rounded-2xl font-black bg-primary">تحصيل المديونية</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="payables" className="space-y-4">
                    <div className="glass-card p-4 h-16 rounded-2xl flex items-center gap-4 border border-white/10 mb-6">
                        <Search className="text-muted-foreground" />
                        <Input placeholder="بحث باسم المورد..." className="border-0 bg-transparent h-full text-lg focus-visible:ring-0" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    {payables.bySupplier.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map((s, i) => (
                        <Card key={i} className="glass-card p-6 border-white/5 hover:border-rose-500/20 transition-all rounded-[2rem]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-xl">{s.name.charAt(0)}</div>
                                    <div><h4 className="text-xl font-black">{s.name}</h4><Badge variant="outline" className="text-[10px] opacity-60">{s.pos.length} أوامر شراء قيد السداد</Badge></div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-left"><p className="text-[10px] font-bold opacity-40 uppercase">إجمالي المستحق</p><p className="text-3xl font-black text-rose-500 font-mono">{s.totalDebt.toLocaleString()}</p></div>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handleOpenSchedule(s, 'payable')} variant="outline" className="h-14 px-4 rounded-2xl border-white/10 hover:bg-white/5" title="جدولة السداد">
                                            <CalendarPlus className="w-5 h-5 text-rose-500" />
                                        </Button>
                                        <div className="flex items-center gap-2">
                                            <Button onClick={() => handleOpenSchedule(s, 'payable')} variant="outline" className="h-14 px-4 rounded-2xl border-white/10 hover:bg-white/5" title="جدولة السداد">
                                                <CalendarPlus className="w-5 h-5 text-rose-500" />
                                            </Button>
                                            <Button onClick={() => openSettlement(s, 'payable')} className="h-14 px-8 rounded-2xl font-black bg-rose-500 hover:bg-rose-600">سداد المستحقات</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>

            {/* Settlement Dialog */}
            <Dialog open={isSettlementOpen} onOpenChange={setIsSettlementOpen}>
                <DialogContent className="sm:max-w-[480px] border-white/10 p-0 rounded-[2.5rem] overflow-hidden" dir="rtl">
                    <div className={cn("p-6 border-b border-white/10", settlementType === 'receivable' ? "bg-emerald-500/5" : "bg-rose-500/5")}>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black flex items-center gap-2">
                                <span className={cn("p-2 rounded-xl", settlementType === 'receivable' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                                    {settlementType === 'receivable' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                </span>
                                {settlementType === 'receivable' ? 'تحصيل مديونية' : 'سداد مديونية مورد'}
                            </DialogTitle>
                            <DialogDescription className="font-bold pt-1">{selectedEntity?.name}</DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <div><p className="text-xs font-bold opacity-40 mb-1">المبلغ المتبقي</p><p className={cn("text-2xl font-black", settlementType === 'receivable' ? "text-emerald-500" : "text-rose-500")}>
                                {(settlementType === 'receivable' ? selectedEntity?.invoices[0]?.balance : (selectedEntity?.pos[0]?.totalCost - (selectedEntity?.pos[0]?.paidAmount || 0)))?.toLocaleString()} ج.م
                            </p></div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold">قيمة الدفعة</Label>
                                <Input type="number" className="h-14 rounded-2xl bg-white/5 border-white/5 font-mono text-xl font-black" value={settlementAmount} onChange={(e) => setSettlementAmount(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">طريقة السداد</Label>
                                <Select value={settlementMethod} onValueChange={setSettlementMethod}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/5 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl bg-[#1e293b] border-white/10">
                                        <SelectItem value="cash">نقداً</SelectItem>
                                        <SelectItem value="bank">تحويل بنكي</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Textarea placeholder="ملاحظات إضافية..." className="min-h-[80px] rounded-2xl bg-white/5 border-white/5" value={settlementNote} onChange={(e) => setSettlementNote(e.target.value)} />
                        </div>
                        <Button className={cn("w-full h-14 rounded-2xl text-lg font-black", settlementType === 'receivable' ? "bg-primary" : "bg-rose-500 hover:bg-rose-600")} onClick={handleSettlement} disabled={settlementMutation.isPending}>
                            {settlementMutation.isPending ? <Loader2 className="animate-spin" /> : 'تأكيد العملية'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Schedule Dialog */}
            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                <DialogContent className="sm:max-w-[650px] border-white/10 p-0 rounded-[2.5rem] overflow-hidden" dir="rtl">
                    <div className="p-6 border-b border-white/10 bg-black/20">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black flex items-center gap-2">
                                <span className={cn("p-2 rounded-xl", settlementType === 'receivable' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                                    <CalendarPlus size={20} />
                                </span>
                                جدولة الدفعات (Installment Plan)
                            </DialogTitle>
                            <DialogDescription className="font-bold pt-1 flex justify-between items-center">
                                <span>{selectedEntity?.name}</span>
                                <span className="font-mono text-lg">{selectedEntity?.totalDebt?.toLocaleString()} EGP</span>
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold opacity-60">
                                <span>المجدول: {calculateScheduledTotal().toLocaleString()}</span>
                                <span>المتبقي: {(selectedEntity?.totalDebt - calculateScheduledTotal()).toLocaleString()}</span>
                            </div>
                            <div className="h-4 bg-white/5 rounded-full overflow-hidden flex">
                                <div
                                    className={cn("h-full transition-all duration-500", settlementType === 'receivable' ? "bg-emerald-500" : "bg-rose-500")}
                                    style={{ width: `${Math.min((calculateScheduledTotal() / (selectedEntity?.totalDebt || 1)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Rows */}
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {scheduleRows.map((row, i) => (
                                <div key={i} className="flex gap-2 items-start animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            placeholder="المبلغ"
                                            type="number"
                                            className="bg-white/5 border-white/5 rounded-xl font-mono text-center"
                                            value={row.amount}
                                            onChange={(e) => updateScheduleRow(i, 'amount', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            type="date"
                                            className="bg-white/5 border-white/5 rounded-xl text-center"
                                            value={row.dueDate}
                                            onChange={(e) => updateScheduleRow(i, 'dueDate', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-[1.5] space-y-1">
                                        <Input
                                            placeholder="ملاحظات (شيك، قسط 1...)"
                                            className="bg-white/5 border-white/5 rounded-xl"
                                            value={row.notes}
                                            onChange={(e) => updateScheduleRow(i, 'notes', e.target.value)}
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-500/10 rounded-xl" onClick={() => removeScheduleRow(i)}>
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full border-dashed border-white/20 h-12 rounded-xl hover:bg-white/5 gap-2 opacity-60 hover:opacity-100" onClick={addScheduleRow}>
                                <PlusCircle size={18} /> إضافة قسط جديد
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button className="w-full h-12 font-black rounded-xl text-lg" disabled={scheduleMutation.isPending} onClick={saveSchedule}>
                                {scheduleMutation.isPending ? <Loader2 className="animate-spin" /> : 'حفظ الجدول الزمني'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-[550px] border-white/10 p-0 rounded-[2.5rem] overflow-hidden" dir="rtl">
                    <div className="p-6 border-b border-white/10 bg-primary/5">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Settings size={20} />
                                </span>
                                إعدادات الرقابة المالية والإشعارات
                            </DialogTitle>
                            <DialogDescription className="font-bold pt-1">التحكم في فترات الاستحقاق والتنبيهات الآلية</DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="font-black flex items-center gap-2"><BellRing size={16} className="text-emerald-500" /> تنبيه تحصيل العملاء</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        className="h-12 rounded-xl bg-white/5 border-white/5 font-mono text-lg font-bold pl-12"
                                        value={settingsForm.customerCollectionAlertDays}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, customerCollectionAlertDays: parseInt(e.target.value) })}
                                    />
                                    <span className="absolute left-4 top-3 text-xs font-bold opacity-40">أيام قبل الاستحقاق</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black flex items-center gap-2"><BellRing size={16} className="text-rose-500" /> تنبيه سداد الموردين</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        className="h-12 rounded-xl bg-white/5 border-white/5 font-mono text-lg font-bold pl-12"
                                        value={settingsForm.supplierPaymentAlertDays}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, supplierPaymentAlertDays: parseInt(e.target.value) })}
                                    />
                                    <span className="absolute left-4 top-3 text-xs font-bold opacity-40">أيام قبل الاستحقاق</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5 my-2" />

                        <div className="space-y-3">
                            <Label className="font-black flex items-center gap-2"><Clock size={16} className="text-amber-500" /> فترة السداد الافتراضية للموردين (Terms)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="h-12 rounded-xl bg-white/5 border-white/5 font-mono text-lg font-bold pl-12"
                                    value={settingsForm.defaultSupplierTerms}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, defaultSupplierTerms: parseInt(e.target.value) })}
                                />
                                <span className="absolute left-4 top-3 text-xs font-bold opacity-40">يوم من الاستلام</span>
                            </div>
                            <p className="text-xs opacity-40 font-bold px-1">يتم احتساب تاريخ استحقاق الدين تلقائياً من تاريخ استلام أمر الشراء + هذه الفترة.</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="font-black flex items-center gap-2"><DollarSign size={16} className="text-blue-500" /> الحد الأدنى للتنبيهات المالية</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="h-12 rounded-xl bg-white/5 border-white/5 font-mono text-lg font-bold pl-12"
                                    value={settingsForm.minDebtNotificationAmount}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, minDebtNotificationAmount: parseInt(e.target.value) })}
                                />
                                <span className="absolute left-4 top-3 text-xs font-bold opacity-40">ج.م</span>
                            </div>
                            <p className="text-xs opacity-40 font-bold px-1">لن يتم إرسال إشعارات للديون التي تقل عن هذا المبلغ.</p>
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl text-lg font-black bg-primary mt-4"
                            onClick={() => settingsMutation.mutate(settingsForm)}
                            disabled={settingsMutation.isPending}
                        >
                            {settingsMutation.isPending ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2"><Save size={20} /> حفظ الإعدادات</span>}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}

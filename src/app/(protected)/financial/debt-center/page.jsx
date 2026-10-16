'use client';

import { useState } from 'react';
import { useDebtors, useDebts, useDebtOverview } from '@/hooks/useFinancial';
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    Download,
    Loader2,
    RefreshCcw,
    Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DebtorTable } from '@/components/financial/DebtorTable';
import { DebtTable } from '@/components/financial/DebtTable';
import { UnifiedPaymentDialog } from '@/components/financial/PaymentDialog';
import { InstallmentDialog } from '@/components/financial/InstallmentDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/utils';

export default function DebtCenterPage() {
    const [activeTab, setActiveTab] = useState('Customer');
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isInstallmentOpen, setIsInstallmentOpen] = useState(false);
    const [isUnifiedOpen, setIsUnifiedOpen] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [search, setSearch] = useState('');

    const { data: overview, isLoading: isOverviewLoading, refetch: refetchOverview, isFetching: isOverviewFetching, isError: isOverviewError, error: overviewError } = useDebtOverview();
    // For Customers: Aggregated view
    const { data: debtorsData, isLoading: isDebtorsLoading, isError: isDebtorsError, error: debtorsError, refetch: refetchDebtors, isFetching: isDebtorsFetching } = useDebtors({
        type: 'Customer',
        search: search
    });

    // For Suppliers: Classic Invoice view
    const { data: debtsData, isLoading: isDebtsLoading, isError: isDebtsError, error: debtsError, refetch: refetchDebts, isFetching: isDebtsFetching } = useDebts({
        debtorType: 'Supplier',
        status: 'active,overdue'
    });

    const debtors = debtorsData?.debtors || [];
    const debts = debtsData?.debts || [];
    const stats = [
        { title: 'إجمالي المستحقات', value: overview?.receivables?.total || 0, trend: `تم تحصيل: ${(overview?.receivables?.collected || 0).toLocaleString()} د.ل`, icon: TrendingUp, color: 'text-success' },
        { title: 'ديون الموردين', value: overview?.payables?.total || 0, trend: `تم سداد: ${(overview?.payables?.collected || 0).toLocaleString()} د.ل`, icon: TrendingDown, color: 'text-warning' },
        { title: 'ديون متأخرة', value: overview?.receivables?.overdue || 0, trend: 'تحتاج متابعة', icon: AlertCircle, color: 'text-destructive' },
        { title: 'الميزانية الصافية', value: overview?.totalNet || 0, trend: overview?.riskScore || 'HEALTHY', icon: CheckCircle2, color: 'text-info' },
    ];

    const handleRecordPayment = (debt) => {
        setSelectedDebt(debt);
        setIsPaymentOpen(true);
    };

    const handleScheduleInstallment = (debt) => {
        setSelectedDebt(debt);
        setIsInstallmentOpen(true);
    };

    const handleUnifiedCollection = (debtorItem) => {
        setSelectedDebtor({
            id: debtorItem.debtor._id,
            name: debtorItem.debtor.name,
            balance: debtorItem.totalDebt
        });
        setIsUnifiedOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}

            {/* Header Section */}
            <PageHeader
                title="مركز إدارة الديون"
                subtitle="متابعة المستحقات والمدفوعات والتسويات المالية"
                icon={TrendingUp}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            className="h-12 px-5 rounded-2xl font-bold gap-2 glass-card border-white/10 hover:border-primary/50 transition-all shadow-lg"
                            onClick={() => {
                                refetchOverview();
                                refetchDebtors();
                                refetchDebts();
                            }}
                            disabled={isOverviewFetching || isDebtorsFetching || isDebtsFetching}
                        >
                            <RefreshCcw className={cn("h-5 w-5", (isOverviewFetching || isDebtorsFetching || isDebtsFetching) && "animate-spin")} />
                            تحديث
                        </Button>
                        <Button variant="outline" className="h-12 px-5 rounded-2xl font-bold gap-2 glass-card border-white/10 hover:border-primary/50 transition-all shadow-lg">
                            <Download size={20} /> تصدير
                        </Button>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="إجمالي المستحقات"
                    value={overview?.receivables?.total?.toLocaleString() || 0}
                    unit="ج.م"
                    icon={TrendingUp}
                    variant="primary"
                    subtitle={`تم تحصيل: ${(overview?.receivables?.collected || 0).toLocaleString()} ج.م`}
                />
                <StatCard
                    title="ديون الموردين"
                    value={overview?.payables?.total?.toLocaleString() || 0}
                    unit="ج.م"
                    icon={TrendingDown}
                    variant="warning"
                    subtitle={`تم سداد: ${(overview?.payables?.collected || 0).toLocaleString()} ج.م`}
                />
                <StatCard
                    title="ديون متأخرة"
                    value={overview?.receivables?.overdue?.toLocaleString() || 0}
                    unit="ج.م"
                    icon={AlertCircle}
                    variant="destructive"
                    subtitle="تحتاج متابعة فورية"
                />
                <StatCard
                    title="الميزانية الصافية"
                    value={overview?.totalNet?.toLocaleString() || 0}
                    unit="ج.م"
                    icon={CheckCircle2}
                    variant="success"
                    subtitle={overview?.riskScore || 'HEALTHY'}
                />
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 border border-white/5 p-1 rounded-2xl h-14">
                    <TabsTrigger value="Customer" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-full">ديون العملاء (مستحقات)</TabsTrigger>
                    <TabsTrigger value="Supplier" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-full">ديون الموردين (التزامات)</TabsTrigger>
                </TabsList>

                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center justify-between">
                    <div className="relative group flex-1">
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary h-6 w-6 group-focus-within:animate-pulse transition-all" />
                        <Input
                            placeholder="بحث باسم العميل أو المورد..."
                            className="h-16 pr-16 pl-8 rounded-[2rem] bg-card/40 border-white/10 focus:bg-card/60 focus:border-primary/50 transition-all font-bold text-xl placeholder:text-muted-foreground/30 shadow-2xl backdrop-blur-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
                    <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                <h2 className="text-2xl font-bold tracking-tight">سجل التزامات الجهات</h2>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            {isOverviewError || isDebtorsError || isDebtsError ? (
                                <div className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <AlertCircle className="h-12 w-12 text-destructive" />
                                        <div>
                                            <h3 className="font-bold text-destructive text-lg">تعذر تحميل البيانات</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {(overviewError?.message || debtorsError?.message || debtsError?.message) || 'حدث خطأ أثناء جلب البيانات من الخادم'}
                                            </p>
                                        </div>
                                        <Button onClick={() => { refetchOverview(); refetchDebtors(); refetchDebts(); }} variant="outline" className="gap-2">
                                            <RefreshCcw className="h-4 w-4" /> إعادة المحاولة
                                        </Button>
                                    </div>
                                </div>
                            ) : (activeTab === 'Customer' ? isDebtorsLoading : isDebtsLoading) ? (
                                <div className="p-32 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary w-12 h-12 opacity-50" />
                                    <p className="mt-4 text-muted-foreground font-bold">جاري مزامنة الديون...</p>
                                </div>
                            ) : (activeTab === 'Customer' ? debtors.length === 0 : debts.length === 0) ? (
                                <div className="p-16 text-center">
                                    <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                                        <Wallet className="h-12 w-12 text-muted-foreground/40" />
                                        <h3 className="font-bold text-lg">لا توجد مديونيات حالياً</h3>
                                        <p className="text-sm text-muted-foreground">
                                            لم يتم تسجيل أي مديونية في هذه الفئة حتى الآن. إذا كان لديك عملاء أو موردين لديهم رصيد سابق في النظام، يمكنك استخدام زر &quot;مزامنة المديونيات&quot; أعلاه لإنشاء السجلات المناسبة.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                activeTab === 'Customer' ? (
                                    <DebtorTable
                                        debtors={debtors}
                                        onUnifiedCollection={handleUnifiedCollection}
                                    />
                                ) : (
                                    <DebtTable
                                        debts={debts.filter(d =>
                                            d.debtorId?.name?.toLowerCase().includes(search.toLowerCase())
                                        )}
                                        onRecordPayment={handleRecordPayment}
                                        onScheduleInstallment={handleScheduleInstallment}
                                        onUnifiedCollection={() => { }}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <UnifiedPaymentDialog
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                target={{ kind: 'debt', debt: selectedDebt }}
            />

            <InstallmentDialog
                open={isInstallmentOpen}
                onOpenChange={setIsInstallmentOpen}
                debt={selectedDebt}
            />

            <UnifiedPaymentDialog
                open={isUnifiedOpen}
                onOpenChange={setIsUnifiedOpen}
                target={{ kind: 'customer-total', customerId: selectedDebtor?.id, customerName: selectedDebtor?.name, totalBalance: selectedDebtor?.balance }}
            />
        </div>
    );
}

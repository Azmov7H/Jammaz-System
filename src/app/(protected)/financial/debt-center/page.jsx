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
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DebtorTable } from '@/components/financial/DebtorTable';
import { DebtTable } from '@/components/financial/DebtTable';
import { PaymentDialog } from '@/components/financial/PaymentDialog';
import { InstallmentDialog } from '@/components/financial/InstallmentDialog';
import { UnifiedPaymentDialog } from '@/components/financial/UnifiedPaymentDialog';
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

    const { data: overview, isLoading: isOverviewLoading } = useDebtOverview();
    // For Customers: Aggregated view
    const { data: debtorsData, isLoading: isDebtorsLoading } = useDebtors({
        type: 'Customer',
        search: search
    });

    // For Suppliers: Classic Invoice view
    const { data: debtsData, isLoading: isDebtsLoading } = useDebts({
        debtorType: 'Supplier',
        status: 'active,overdue'
    });

    const debtors = debtorsData?.debtors || [];
    const debts = debtsData?.debts || [];
    const stats = [
        { title: 'إجمالي المستحقات', value: overview?.receivables?.total || 0, trend: `تم تحصيل: ${(overview?.receivables?.collected || 0).toLocaleString()} د.ل`, icon: TrendingUp, color: 'text-emerald-500' },
        { title: 'ديون الموردين', value: overview?.payables?.total || 0, trend: `تم سداد: ${(overview?.payables?.collected || 0).toLocaleString()} د.ل`, icon: TrendingDown, color: 'text-amber-500' },
        { title: 'ديون متأخرة', value: overview?.receivables?.overdue || 0, trend: 'تحتاج متابعة', icon: AlertCircle, color: 'text-rose-500' },
        { title: 'الميزانية الصافية', value: overview?.totalNet || 0, trend: overview?.riskScore || 'HEALTHY', icon: CheckCircle2, color: 'text-blue-500' },
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
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            {/* Header Section */}
            <PageHeader
                title="مركز إدارة الديون"
                subtitle="متابعة المستحقات والمدفوعات والتسويات المالية"
                icon={TrendingUp}
                actions={
                    <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-lg gap-3 glass-card border-white/10 hover:border-primary/50 transition-all shadow-lg">
                        <Download size={22} /> تصدير تقرير
                    </Button>
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
                    <TabsTrigger value="Customer" className="rounded-xl px-8 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-full">ديون العملاء (مستحقات)</TabsTrigger>
                    <TabsTrigger value="Supplier" className="rounded-xl px-8 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-full">ديون الموردين (التزامات)</TabsTrigger>
                </TabsList>

                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center justify-between">
                    <div className="relative group flex-1">
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary h-6 w-6 group-focus-within:animate-pulse transition-all" />
                        <Input
                            placeholder="بحث باسم العميل أو المورد..."
                            className="h-16 pr-16 pl-8 rounded-[2rem] bg-card/40 border-white/10 focus:bg-card/60 focus:border-primary/50 transition-all font-black text-xl placeholder:text-muted-foreground/30 shadow-2xl backdrop-blur-xl ring-0 focus-visible:ring-0"
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
                                <h2 className="text-2xl font-black tracking-tight">سجل التزامات الجهات</h2>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            {(activeTab === 'Customer' ? isDebtorsLoading : isDebtsLoading) ? (
                                <div className="p-32 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary w-12 h-12 opacity-50" />
                                    <p className="mt-4 text-muted-foreground font-black">جاري مزامنة الديون...</p>
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
                                        // These handlers for DebtTable need to be defined or we need to ensure they are passed if we use DebtTable
                                        onRecordPayment={handleRecordPayment}
                                        onScheduleInstallment={handleScheduleInstallment}
                                        onUnifiedCollection={() => { }} // Not applicable for suppliers yet
                                    />
                                )
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <PaymentDialog
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                debt={selectedDebt}
            />

            <InstallmentDialog
                open={isInstallmentOpen}
                onOpenChange={setIsInstallmentOpen}
                debt={selectedDebt}
            />

            <UnifiedPaymentDialog
                open={isUnifiedOpen}
                onOpenChange={setIsUnifiedOpen}
                customerId={selectedDebtor?.id}
                customerName={selectedDebtor?.name}
                totalBalance={selectedDebtor?.balance}
            />
        </div>
    );
}

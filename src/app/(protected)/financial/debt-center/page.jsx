'use client';

import { useState } from 'react';
import { useDebts, useDebtOverview } from '@/hooks/useFinancial';
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
import { DebtTable } from '@/components/financial/DebtTable';
import { PaymentDialog } from '@/components/financial/PaymentDialog';
import { InstallmentDialog } from '@/components/financial/InstallmentDialog';

export default function DebtCenterPage() {
    const [activeTab, setActiveTab] = useState('Customer');
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isInstallmentOpen, setIsInstallmentOpen] = useState(false);
    const [search, setSearch] = useState('');

    const { data: overview, isLoading: isOverviewLoading } = useDebtOverview();
    const { data: debtsData, isLoading: isDebtsLoading } = useDebts({
        debtorType: activeTab,
        status: 'active'
    });

    const debts = debtsData?.debts || [];
    const stats = [
        { title: 'إجمالي المستحقات', value: overview?.receivables?.total || 0, trend: '', icon: TrendingUp, color: 'text-emerald-500' },
        { title: 'ديون متأخرة', value: overview?.receivables?.overdue || 0, trend: '', icon: AlertCircle, color: 'text-rose-500' },
        { title: 'ديون الموردين', value: overview?.payables?.total || 0, trend: '', icon: TrendingDown, color: 'text-amber-500' },
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

    return (
        <div className="space-y-8 animate-fade-in-up" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">مركز إدارة الديون</h1>
                    <p className="text-muted-foreground font-medium mt-1">متابعة المستحقات والمدفوعات والتسويات المالية</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-12 rounded-xl gap-2 border-white/10 bg-white/5 font-bold">
                        <Download size={16} /> تصدير تقرير
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-white/5 bg-card/50 backdrop-blur-xl rounded-2xl shadow-custom-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">
                                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                {typeof stat.value === 'number' && <span className="text-xs text-muted-foreground mr-1">د.ل</span>}
                            </div>
                            <p className="text-[10px] font-bold mt-1 text-muted-foreground">
                                {stat.trend ? `الحالة: ${stat.trend}` : 'تحديث لحظي'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 border border-white/5 p-1 rounded-2xl h-14">
                    <TabsTrigger value="Customer" className="rounded-xl px-8 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-full">ديون العملاء (مستحقات)</TabsTrigger>
                    <TabsTrigger value="Supplier" className="rounded-xl px-8 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-full">ديون الموردين (التزامات)</TabsTrigger>
                </TabsList>

                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-2xl border border-white/5 shadow-custom-sm">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="بحث باسم العميل أو المورد..."
                            className="h-12 pr-12 rounded-xl bg-muted/30 border-white/10 font-bold"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
                    <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden shadow-custom-xl">
                        <CardContent className="p-0">
                            {isDebtsLoading ? (
                                <div className="p-32 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary w-12 h-12 opacity-50" />
                                    <p className="mt-4 text-muted-foreground font-black">جاري مزامنة الديون...</p>
                                </div>
                            ) : (
                                <DebtTable
                                    debts={debts.filter(d =>
                                        d.debtorId?.name?.toLowerCase().includes(search.toLowerCase())
                                    )}
                                    onRecordPayment={handleRecordPayment}
                                    onScheduleInstallment={handleScheduleInstallment}
                                />
                            )}
                        </CardContent>
                    </Card>
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
        </div>
    );
}

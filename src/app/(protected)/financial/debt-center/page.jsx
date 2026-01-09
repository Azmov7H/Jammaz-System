'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DebtTable } from '@/components/financial/DebtTable';
import { PaymentDialog } from '@/components/financial/PaymentDialog';

// Placeholder for stats - normally fetched from API (Consider a separate stats endpoint)
const STATS = [
    { title: 'إجمالي المستحقات', value: 125000, trend: '+12%', icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'ديون متأخرة', value: 45000, trend: '+5%', icon: AlertCircle, color: 'text-rose-500' },
    { title: 'معدل التحصيل', value: '68%', trend: '+2%', icon: CheckCircle2, color: 'text-blue-500' },
    { title: 'إجمالي الديون (موردين)', value: 85000, trend: '-8%', icon: TrendingDown, color: 'text-amber-500' },
];

export default function DebtCenterPage() {
    const [activeTab, setActiveTab] = useState('Customer');
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const { data: debtsData, isLoading } = useQuery({
        queryKey: ['debts', activeTab],
        queryFn: async () => {
            const params = new URLSearchParams({
                debtorType: activeTab,
                status: 'active' // Default to active? Or maybe show all but filter in UI
            });
            const res = await fetch(`/api/financial/debts?${params}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        }
    });

    const debts = debtsData?.data?.debts || [];

    const handleRecordPayment = (debt) => {
        setSelectedDebt(debt);
        setIsPaymentOpen(true);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">مركز إدارة الديون</h1>
                    <p className="text-muted-foreground font-medium">متابعة المستحقات والمدفوعات والتسويات المالية</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download size={16} /> تصدير تقرير
                    </Button>
                    <Button className="gap-2 bg-primary text-white hover:bg-primary/90">
                        <TrendingUp size={16} /> تسجيل دفعة جديدة
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map((stat, i) => (
                    <Card key={i} className="border-white/5 bg-white/5 backdrop-blur-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">
                                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                {typeof stat.value === 'number' && <span className="text-xs text-muted-foreground mr-1">ج.م</span>}
                            </div>
                            <p className={`text-xs font-bold mt-1 ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {stat.trend} عن الشهر الماضي
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white/5 border border-white/5 p-1 rounded-xl">
                    <TabsTrigger value="Customer" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">ديون العملاء (مستحقات)</TabsTrigger>
                    <TabsTrigger value="Supplier" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">ديون الموردين (التزامات)</TabsTrigger>
                </TabsList>

                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-white/5">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input placeholder="بحث باسم العميل أو رقم الفاتورة..." className="pr-10 bg-background/50" />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto mr-auto">
                        <Button variant="outline" size="sm" className="gap-2 border-dashed">
                            <Filter size={14} /> تصفية حسب الحالة
                        </Button>
                    </div>
                </div>

                <TabsContent value={activeTab} className="mt-0">
                    <Card className="border-white/5 bg-white/[0.02]">
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <p>جاري تحميل البيانات...</p>
                                </div>
                            ) : (
                                <DebtTable debts={debts} onRecordPayment={handleRecordPayment} />
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
        </div>
    );
}

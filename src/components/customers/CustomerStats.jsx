import {
    Users,
    Wallet,
    AlertCircle,
    Clock,
    HandCoins,
    TrendingUp
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

export function DebtOverviewCards({
    totalReceivables,
    pendingInvoicesCount,
    debtsCount,
    totalOverdue
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="إجمالي المطلوبات"
                value={totalReceivables?.toLocaleString() || 0}
                unit="ج.م"
                icon={HandCoins}
                variant="primary"
                subtitle="الفواتير والديون المفتوحة"
            />
            <StatCard
                title="فواتير معلقة"
                value={pendingInvoicesCount || 0}
                unit="فاتورة"
                icon={Clock}
                variant="warning"
                subtitle="تحتاج لمتابعة سداد"
            />
            <StatCard
                title="الديون النشطة"
                value={debtsCount || 0}
                unit="دين"
                icon={Wallet}
                variant="destructive"
                subtitle="خارج سجل الفواتير"
            />
            <StatCard
                title="متأخرات التحصيل"
                value={totalOverdue?.toLocaleString() || 0}
                unit="ج.م"
                icon={AlertCircle}
                variant="info"
                subtitle="تجاوزت موعد الاستحقاق"
            />
        </div>
    );
}

export function CustomerStatsCards({
    totalCustomers,
    wholesaleCount,
    retailCount,
    activeBalanceCount
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="إجمالي العملاء"
                value={totalCustomers}
                unit=""
                icon={Users}
                variant="primary"
                subtitle="إجمالي المسجلين"
            />
            <StatCard
                title="عملاء الجملة"
                value={wholesaleCount}
                unit=""
                icon={TrendingUp}
                variant="success"
                subtitle="مبيعات الكميات"
            />
            <StatCard
                title="عملاء القطاعي"
                value={retailCount}
                unit=""
                icon={Users}
                variant="info"
                subtitle="مبيعات التجزئة"
            />
            <StatCard
                title="العملاء المدينين"
                value={activeBalanceCount}
                unit=""
                icon={Wallet}
                variant="warning"
                subtitle="لديهم أرصدة للسداد"
            />
        </div>
    );
}

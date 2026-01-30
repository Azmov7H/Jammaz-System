import {
    Layers,
    AlertTriangle,
    XCircle,
    Box
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

export function ProductStatsCards({ stats }) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="إجمالي الأصناف"
                value={stats.total}
                unit=""
                icon={Layers}
                variant="primary"
                subtitle="عدد المنتجات النشطة"
            />
            <StatCard
                title="أصناف منخفضة"
                value={stats.low}
                unit=""
                icon={AlertTriangle}
                variant="warning"
                subtitle="تحتاج لإعادة طلب"
            />
            <StatCard
                title="أصناف نفذت"
                value={stats.out}
                unit=""
                icon={XCircle}
                variant="destructive"
                subtitle="يتطلب إجراء فوري"
            />
            <StatCard
                title="قيمة المخزون"
                value={(stats.value || 0).toLocaleString()}
                unit="ج.م"
                icon={Box}
                variant="success"
                subtitle="إجمالي رأس المال"
            />
        </div>
    );
}

'use client';

import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils';

// Lazy load recharts (~200KB) - loads after initial paint
const RevenueChartContent = dynamic(
    () => import('./RevenueChartContent').then(mod => mod.RevenueChartContent),
    {
        ssr: false,
        loading: () => (
            <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-xl animate-pulse" />
            </div>
        )
    }
);

export function RevenueChart({ data, className }) {
    return (
        <Card className={cn("glass-card border-none shadow-custom-xl overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                    نمو المبيعات
                    <span className="text-xs font-medium text-muted-foreground opacity-60">(آخر 6 أشهر)</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
                <RevenueChartContent data={data} />
            </CardContent>
        </Card>
    );
}

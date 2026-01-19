'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    defs,
    linearGradient,
    stop
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { cn } from '@/utils';

export function RevenueChart({ data, className }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <Card className={cn("glass-card border-none shadow-custom-xl overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                    نمو المبيعات
                    <span className="text-xs font-medium text-muted-foreground opacity-60">(آخر 6 أشهر)</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? 'rgba(15, 15, 20, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '12px',
                                border: '1px solid hsla(var(--primary) / 0.2)',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                                fontWeight: 'bold'
                            }}
                            itemStyle={{ color: 'hsl(var(--primary))' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorSales)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Target, TrendingUp, Lightbulb, BarChart4, Package, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const salesGoals = [
    { name: 'يناير', target: 50000, actual: 45000 },
    { name: 'فبراير', target: 55000, actual: 52000 },
    { name: 'مارس', target: 60000, actual: 68000 },
    { name: 'أبريل', target: 65000, actual: 60000 },
];

const iconMap = {
    bundle: Package,
    abc: BarChart4,
    reorder: TrendingUp
};

export default function StrategyPage() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['strategy-suggestions'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/strategy');
            if (!res.ok) throw new Error('Failed to fetch strategies');
            return res.json();
        }
    });

    const suggestions = data?.suggestions || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <Brain className="text-secondary h-8 w-8" />
                        استراتيجيات تحسين المبيعات
                    </h1>
                    <p className="text-muted-foreground mt-1">خطط ذكية وتحليلات مبنية على بياناتك لزيادة الأرباح</p>
                </div>
                <Button
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground"
                >
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    تحديث التحليل الذكي
                </Button>
            </div>

            {/* Top Cards (Keeping static for now or can be wired later) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="h-5 w-5 text-secondary" /> معدل تحقيق الأهداف
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">85%</div>
                        <p className="text-sm opacity-80 mt-1">من هدف المبيعات الشهري</p>
                        <div className="w-full bg-black/20 h-2 rounded-full mt-4">
                            <div className="bg-secondary h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card shadow-lg border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-foreground flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" /> النمو السنوي
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-foreground">+12.5%</div>
                        <p className="text-sm text-muted-foreground mt-1">مقارنة بالعام الماضي</p>
                    </CardContent>
                </Card>

                <Card className="bg-card shadow-lg border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-foreground flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" /> فرص ضائعة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-foreground">15,000 ج.م</div>
                        <p className="text-sm text-muted-foreground mt-1">بسبب نفاد المخزون الشهر الماضي</p>
                    </CardContent>
                </Card>
            </div>

            {/* Suggestions Grid */}
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Lightbulb className="text-yellow-500" /> اقتراحات الذكاء التجاري
            </h2>

            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
            ) : suggestions.length === 0 ? (
                <Card className="p-10 text-center border-dashed border-2">
                    <p className="text-muted-foreground">لا توجد اقتراحات كافية حالياً. نحتاج لمزيد من البيانات.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suggestions.map((item, i) => {
                        const Icon = iconMap[item.type] || Lightbulb;
                        return (
                            <Card key={i} className="border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 rounded-lg bg-primary/10 w-fit">
                                            <Icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.impact === 'عالي' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                            تأثير {item.impact}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg font-bold mt-2 text-foreground">{item.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                    <Button variant="outline" className="w-full mt-4 border-primary/20 hover:bg-primary/5 text-primary">تطبيق الاقتراح</Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

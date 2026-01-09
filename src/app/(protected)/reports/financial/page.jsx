'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function FinancialReportPage() {
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['financial-report', startDate, endDate],
        queryFn: async () => {
            const res = await fetch(`/api/reports/financial?startDate=${startDate}&endDate=${endDate}`);
            if (!res.ok) throw new Error('Failed to fetch report');
            return res.json();
        }
    });

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin" /></div>;

    const { financials } = data || {};

    return (
        <div className="space-y-6 max-w-4xl mx-auto print:max-w-none">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
                <div className="flex gap-4 items-end">
                    <div>
                        <Label>من تاريخ</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <Label>إلى تاريخ</Label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <Button onClick={() => refetch()} variant="outline"><Calendar className="w-4 h-4" /></Button>
                </div>
                <Button onClick={handlePrint} className="gap-2">
                    <Printer className="w-4 h-4" /> طباعة التقرير
                </Button>
            </div>

            {/* Report Paper */}
            <Card className="border shadow-lg print:shadow-none print:border-none">
                <CardHeader className="text-center border-b pb-8">
                    <CardTitle className="text-3xl font-bold text-gray-900">قائمة الدخل</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        عن الفترة من {format(new Date(startDate), 'dd MMM yyyy', { locale: ar })} إلى {format(new Date(endDate), 'dd MMM yyyy', { locale: ar })}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">

                    {/* 1. Revenue */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">الإيرادات</h3>
                        <div className="space-y-2">
                            {Object.entries(financials?.revenue?.breakdown || {}).map(([name, val]) => (
                                <div key={name} className="flex justify-between text-gray-600">
                                    <span>{name}</span>
                                    <span>{val.toLocaleString()} ج.م</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold text-black text-lg pt-2 mt-2 border-t border-dashed">
                                <span>إجمالي الإيرادات</span>
                                <span>{financials?.revenue?.total.toLocaleString()} ج.م</span>
                            </div>
                        </div>
                    </section>

                    {/* 2. COGS */}
                    <section>
                        <div className="flex justify-between text-red-600 mb-2">
                            <span>تكلفة البضاعة المباعة</span>
                            <span>({financials?.cogs.toLocaleString()}) ج.م</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl bg-gray-50 p-4 rounded-lg mt-4 border">
                            <span>مجمل الربح (Gross Profit)</span>
                            <span>{financials?.grossProfit.toLocaleString()} ج.م</span>
                        </div>
                    </section>

                    {/* 3. Expenses */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">المسروفات التشغيلية</h3>
                        <div className="space-y-2">
                            {Object.entries(financials?.operatingExpenses?.breakdown || {}).map(([name, val]) => (
                                <div key={name} className="flex justify-between text-gray-600">
                                    <span>{name}</span>
                                    <span>({val.toLocaleString()}) ج.م</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold text-black pt-2 mt-2 border-t border-dashed">
                                <span>إجمالي المصروفات</span>
                                <span className="text-red-600">({financials?.operatingExpenses?.total.toLocaleString()}) ج.م</span>
                            </div>
                        </div>
                    </section>

                    {/* 4. Net Profit */}
                    <section className="mt-8 pt-8 border-t-2 border-black">
                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold">صافي الربح (Net Profit)</span>
                            <span className={`text-3xl font-bold ${financials?.netProfit >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-6 py-2 rounded-xl`}>
                                {financials?.netProfit.toLocaleString()} ج.م
                            </span>
                        </div>
                    </section>

                </CardContent>
            </Card>
        </div>
    );
}

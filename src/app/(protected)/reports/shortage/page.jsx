'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, FileWarning } from 'lucide-react';
import { toast } from 'sonner';

export default function ShortageReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/reports/shortage');
            const json = await res.json();
            if (res.ok && json.success) {
                setReports(json.data.reports || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('فشل جلب التقارير');
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports.filter(r => {
        if (filter === 'ALL') return true;
        return r.status === filter;
    });

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <FileWarning className="w-6 h-6 md:w-8 md:h-8 text-destructive" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">بلاغات النواقص</h1>
                        <p className="text-sm text-muted-foreground">متابعة طلبات توفير البضاعة</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant={filter === 'ALL' ? 'default' : 'outline'} onClick={() => setFilter('ALL')} size="sm">
                        الكل
                    </Button>
                    <Button
                        variant={filter === 'PENDING' ? 'default' : 'outline'}
                        onClick={() => setFilter('PENDING')}
                        size="sm"
                        className={filter === 'PENDING' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                    >
                        قيد الانتظار
                    </Button>
                    <Button
                        variant={filter === 'RESOLVED' ? 'default' : 'outline'}
                        onClick={() => setFilter('RESOLVED')}
                        size="sm"
                        className={filter === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                        مكتمل
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredReports.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold text-muted-foreground">لا توجد بلاغات نواقص</h3>
                        </CardContent>
                    </Card>
                ) : (
                    filteredReports.map((report) => (
                        <Card key={report._id} className="border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <div className="flex">
                                <div className={`w-2 shrink-0 ${report.status === 'PENDING' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                                <CardContent className="flex-1 p-4 md:p-6 flex flex-col md:flex-row justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={report.status === 'PENDING' ? 'secondary' : 'default'} className="gap-1">
                                                {report.status === 'PENDING' ? <Clock size={12} /> : <CheckCircle size={12} />}
                                                {report.status === 'PENDING' ? 'قيد الانتظار' : 'تم الرد'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(report.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold">{report.productName}</h3>
                                        <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
                                            <span>الكمية المطلوبة: <span className="font-semibold text-foreground">{report.requestedQty}</span></span>
                                            <span>المتوفر: <span className="font-semibold text-foreground">{report.availableQty}</span></span>
                                        </div>
                                        {report.notes && (
                                            <p className="text-sm bg-muted/50 p-3 rounded-md border">
                                                📝 "{report.notes}"
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-muted-foreground">مقدم الطلب</p>
                                        <p className="font-semibold">{report.requesterName}</p>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

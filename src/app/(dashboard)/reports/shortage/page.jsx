'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
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
            const data = await res.json();
            if (res.ok) {
                setReports(data.reports || []);
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

    if (loading) return <div className="p-8 text-center animate-pulse">جاري التحميل...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#1B3C73]">بلاغات النواقص</h1>
                    <p className="text-slate-500">متابعة طلبات توفير البضاعة من الفروع</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${filter === 'ALL' ? 'bg-[#1B3C73] text-white' : 'bg-white text-slate-600 border'}`}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${filter === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-600 border'}`}
                    >
                        قيد الانتظار
                    </button>
                    <button
                        onClick={() => setFilter('RESOLVED')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${filter === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-white text-slate-600 border'}`}
                    >
                        مكتمل
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredReports.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
                        <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-500">لا توجد بلاغات نواقص</h3>
                    </div>
                ) : (
                    filteredReports.map((report) => (
                        <Card key={report._id} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <div className="flex items-center">
                                <div className={`w-2 h-full min-h-[100px] ${report.status === 'PENDING' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                                <CardContent className="flex-1 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${report.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {report.status === 'PENDING' ? <Clock size={12} /> : <CheckCircle size={12} />}
                                                {report.status === 'PENDING' ? 'قيد الانتظار' : 'تم الرد'}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(report.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#1B3C73]">{report.productName}</h3>
                                        <div className="text-sm text-slate-600 mt-1 flex gap-4">
                                            <span>الكمية المطلوبة: <span className="font-bold">{report.requestedQty}</span></span>
                                            <span>المتوفر وقت الطلب: <span className="font-bold">{report.availableQty}</span></span>
                                        </div>
                                        {report.notes && (
                                            <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                📝 "{report.notes}"
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">مقدم الطلب</p>
                                        <p className="font-bold text-slate-700">{report.requesterName}</p>
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

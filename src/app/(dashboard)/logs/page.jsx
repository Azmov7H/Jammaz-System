'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/logs')
            .then(res => res.json())
            .then(data => setLogs(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">سجلات النظام</h1>
                <p className="text-sm text-slate-500">تتبع العمليات والأحداث</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">وقت الحدث</TableHead>
                            <TableHead className="text-right">المستخدم</TableHead>
                            <TableHead className="text-right">الإجراء</TableHead>
                            <TableHead className="text-right">الكيان</TableHead>
                            <TableHead className="text-right">تفاصيل</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></TableCell></TableRow>
                        ) : logs.map(log => (
                            <TableRow key={log._id}>
                                <TableCell className="text-xs text-slate-500 font-mono">
                                    {new Date(log.date).toLocaleString('ar-SA')}
                                </TableCell>
                                <TableCell className="font-medium">{log.userId?.name || 'System'}</TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                                        {log.action}
                                    </span>
                                </TableCell>
                                <TableCell>{log.entity} <span className="text-xs text-slate-400">#{log.entityId}</span></TableCell>
                                <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                                    {JSON.stringify(log.diff)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

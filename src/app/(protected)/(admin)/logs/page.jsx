'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';

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

    const getActionBadge = (action) => {
        const variants = {
            CREATE: { variant: 'default', label: 'إنشاء' },
            UPDATE: { variant: 'secondary', label: 'تحديث' },
            DELETE: { variant: 'destructive', label: 'حذف' },
        };
        const config = variants[action] || { variant: 'outline', label: action };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">سجلات النظام</h1>
                    <p className="text-sm text-muted-foreground">تتبع العمليات والأحداث</p>
                </div>
            </div>

            <Card className="border shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">وقت الحدث</TableHead>
                                    <TableHead className="text-right">المستخدم</TableHead>
                                    <TableHead className="text-center">الإجراء</TableHead>
                                    <TableHead className="text-right">الكيان</TableHead>
                                    <TableHead className="text-right hidden lg:table-cell">تفاصيل</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            لا توجد سجلات
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map(log => (
                                        <TableRow key={log._id}>
                                            <TableCell className="text-xs text-muted-foreground font-mono">
                                                {new Date(log.date).toLocaleString('ar-SA')}
                                            </TableCell>
                                            <TableCell className="font-medium">{log.userId?.name || 'System'}</TableCell>
                                            <TableCell className="text-center">
                                                {getActionBadge(log.action)}
                                            </TableCell>
                                            <TableCell>
                                                <span>{log.entity}</span>
                                                {log.entityId && (
                                                    <span className="text-xs text-muted-foreground ml-1">
                                                        #{log.entityId.substr(log.entityId.length - 6)}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate hidden lg:table-cell">
                                                {log.diff ? JSON.stringify(log.diff) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function InvoicesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => setDebouncedSearch(val), 500);
    };

    const { data: invoices = [], isLoading } = useInvoices(debouncedSearch);
    const deleteMutation = useDeleteInvoice();

    const handleDelete = (id) => {
        if (!confirm('هل أنت متأكد من حذف الفاتورة؟ سيتم استرجاع الكميات للمخزن.')) return;
        deleteMutation.mutate(id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">المبيعات</h1>
                    <p className="text-sm text-muted-foreground">إدارة الفواتير والمبيعات</p>
                </div>
                <Link href="/invoices/new">
                    <Button className="gap-2">
                        <Plus size={18} />
                        فاتورة جديدة
                    </Button>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative">
                    <FileText className="absolute right-3 top-2.5 text-muted-foreground" size={20} />
                    <Input
                        type="text"
                        placeholder="بحث برقم الفاتورة أو اسم العميل..."
                        className="pr-10"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">رقم الفاتورة</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">العميل</TableHead>
                            <TableHead className="text-right">المجموع</TableHead>
                            <TableHead className="text-right hidden md:table-cell">بواسطة</TableHead>
                            <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    لا توجد فواتير مطابقة
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((inv) => (
                                <TableRow key={inv._id}>
                                    <TableCell className="font-mono text-xs font-bold">
                                        {inv.number}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(inv.date).toLocaleDateString('ar-SA')}
                                    </TableCell>
                                    <TableCell>{inv.customerName || inv.customer?.name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-bold">
                                            {inv.total.toFixed(2)} ج.م
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                                        {inv.createdBy?.name || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/invoices/${inv._id}`}>
                                                <Button size="icon" variant="ghost">
                                                    <FileText size={16} />
                                                </Button>
                                            </Link>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(inv._id)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

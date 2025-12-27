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
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="animate-slide-in-right">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">المبيعات</h1>
                    <p className="text-sm text-muted-foreground">إدارة الفواتير والمبيعات</p>
                </div>
                <Link href="/invoices/new" className="animate-scale-in">
                    <Button className="gap-2 gradient-primary border-0 hover-lift shadow-colored">
                        <Plus size={18} />
                        فاتورة جديدة
                    </Button>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="glass-card p-4 rounded-lg border shadow-custom-md hover-lift transition-all duration-300 group">
                <div className="relative">
                    <FileText className="absolute right-3 top-2.5 text-muted-foreground group-hover:text-primary transition-colors duration-300" size={20} />
                    <Input
                        type="text"
                        placeholder="بحث برقم الفاتورة أو اسم العميل..."
                        className="pr-10 focus-visible:ring-2 focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            {/* Invoices Table */}
            <div className="glass-card rounded-lg border shadow-custom-md overflow-x-auto hover-lift transition-all duration-300">
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
                                <TableRow key={inv._id} className="transition-all duration-300 hover:bg-muted/50 cursor-pointer group">
                                    <TableCell className="font-mono text-xs font-bold group-hover:text-primary transition-colors">
                                        {inv.number}
                                    </TableCell>
                                    <TableCell className="text-sm group-hover:text-foreground transition-colors">
                                        {new Date(inv.date).toLocaleDateString('ar-SA')}
                                    </TableCell>
                                    <TableCell className="group-hover:text-foreground transition-colors">{inv.customerName || inv.customer?.name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-bold shadow-sm hover-scale group-hover:shadow-colored transition-all">
                                            {inv.total.toFixed(2)} ج.م
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                                        {inv.createdBy?.name || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/invoices/${inv._id}`}>
                                                <Button size="icon" variant="ghost" className="hover-scale opacity-0 group-hover:opacity-100 transition-all">
                                                    <FileText size={16} />
                                                </Button>
                                            </Link>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10 hover-scale opacity-0 group-hover:opacity-100 transition-all"
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

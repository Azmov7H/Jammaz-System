'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices';

export default function InvoicesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    // React Query will handle debouncing if we want, or we just debounce the set state. 
    // For now, let's keep it simple: refetch on input change (React Query is fast enough for small datasets, 
    // or add useDebounce if needed later).

    // Actually, to prevent hammering, let's debounce the value passed to the hook.
    // I'll add a simple useDebounce or just rely on state. 
    // For standard UX, let's just pass `searchTerm` and let the API debounce or just handle it.
    // Implementation plan didn't specify debounce util, so I'll trust the user typing speed or basic react state.
    // If it's too aggressive, I can add a timeout.

    // Let's implement manually inside component for now:
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        // Debounce logic
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">المبيعات</h1>
                    <p className="text-sm text-slate-500">إدارة الفواتير والمبيعات</p>
                </div>
                <Link href="/invoices/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                        <Plus size={18} />
                        فاتورة جديدة
                    </Button>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="بحث برقم الفاتورة أو اسم العميل..."
                        className="w-full p-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                    <FileText className="absolute right-3 top-2.5 text-slate-400" size={20} />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">رقم الفاتورة</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">العميل</TableHead>
                            <TableHead className="text-right">المجموع</TableHead>
                            <TableHead className="text-right">بواسطة</TableHead>
                            <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></TableCell></TableRow>
                        ) : invoices.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-slate-500">لا توجد فواتير مطابقة</TableCell></TableRow>
                        ) : (
                            invoices.map((inv) => (
                                <TableRow key={inv._id}>
                                    <TableCell className="font-mono text-xs font-bold">{inv.number}</TableCell>
                                    <TableCell>{new Date(inv.date).toLocaleDateString('ar-SA')}</TableCell>
                                    <TableCell>{inv.customerName || inv.customer?.name || '-'}</TableCell>
                                    <TableCell className="font-bold text-green-600">{inv.total.toFixed(2)}</TableCell>
                                    <TableCell className="text-xs text-slate-500">{inv.createdBy?.name || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/invoices/${inv._id}`}>
                                                <Button size="icon" variant="ghost" className="text-blue-500 hover:bg-blue-50">
                                                    <FileText size={16} />
                                                </Button>
                                            </Link>
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(inv._id)}>
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

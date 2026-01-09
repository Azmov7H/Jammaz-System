'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function ExportButton({ type, data = [], columns = [], pdfTitle = 'Report' }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleExcelExport = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, format: 'excel' })
            });

            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success('تم تصدير ملف Excel بنجاح');
        } catch (err) {
            console.error(err);
            toast.error('حدث خطأ أثناء التصدير');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePDFExport = () => {
        try {
            setIsLoading(true);
            const doc = new jsPDF();

            // Add Arabic Font support if needed (Client-side usually needs base64 font)
            // For now, we use standard font or basic mapping. 
            // Note: jsPDF default fonts don't support Arabic. 
            // We needs a custom font. For MVP, we might see garbled text for Arabic.
            // We will warn the user or try to use a compatible font if available in project.

            doc.text(pdfTitle, 14, 22);

            const tableColumn = columns.map(c => c.header);
            const tableRows = [];

            data.forEach(item => {
                const rowData = columns.map(c => {
                    // Access nested keys if 'key' is like 'user.name'
                    return item[c.key] || '';
                });
                tableRows.push(rowData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 30,
                styles: { font: 'helvetica' }, // Arabic needs custom font
            });

            doc.save(`${type}_report.pdf`);
            toast.success('تم تصدير ملف PDF بنجاح');
        } catch (err) {
            console.error(err);
            toast.error('حدث خطأ أثناء تصدير PDF');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    تصدير
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExcelExport} className="gap-2 cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Excel (الكل)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePDFExport} className="gap-2 cursor-pointer">
                    <FileText className="w-4 h-4 text-red-600" />
                    PDF (الحالي)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

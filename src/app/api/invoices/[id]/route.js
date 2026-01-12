import { apiHandler } from '@/lib/api-handler';
import { InvoiceService } from '@/services/invoiceService';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const invoice = await InvoiceService.getById(id);

    if (!invoice) {
        return NextResponse.json({ success: false, error: 'الفاتورة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { invoice } });
});

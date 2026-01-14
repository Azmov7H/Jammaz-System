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

export const DELETE = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await InvoiceService.deleteInvoice(id, user.userId);
    return NextResponse.json({ success: true, message: 'تم حذف الفاتورة بنجاح' });
});

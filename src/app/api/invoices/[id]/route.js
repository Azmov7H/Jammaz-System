import { apiHandler } from '@/lib/api-handler';
import { InvoiceService } from '@/services/invoiceService';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const invoice = await InvoiceService.getById(id);
    if (!invoice) throw 'الفاتورة غير موجودة';
    return { invoice };
});

export const DELETE = apiHandler(async (req, { params }) => {
    const { id } = await params;
    return await InvoiceService.deleteInvoice(id, req.user.userId);
}, { auth: true });

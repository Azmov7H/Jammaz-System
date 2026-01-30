import { apiHandler } from '@/lib/api-handler';
import { InvoiceService } from '@/services/invoiceService';
import { invoiceSchema } from '@/validations/validators';
import { getCurrentUser } from '@/lib/auth';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    return await InvoiceService.getAll(query);
});

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = invoiceSchema.parse(body);
    return await InvoiceService.create(validated, req.user.userId);
}, { auth: true });

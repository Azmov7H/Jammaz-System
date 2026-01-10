import { apiHandler } from '@/lib/core/api-handler';
import { InvoiceService } from '@/lib/services/invoiceService';
import { invoiceSchema } from '@/lib/core/validators';
import { getCurrentUser } from '@/lib/core/auth';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    return await InvoiceService.getAll(query);
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';
    const body = await req.json();
    const validated = invoiceSchema.parse(body);
    return await InvoiceService.create(validated, user.userId);
});

import { apiHandler } from '@/lib/api-handler';
import { SupplierService } from '@/services/supplierService';
import { supplierSchema } from '@/validations/validators';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    return await SupplierService.getAll(query);
});

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = supplierSchema.parse(body);
    return await SupplierService.create(validated);
}, { auth: true });

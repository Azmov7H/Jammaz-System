import { apiHandler } from '@/lib/api-handler';
import { CustomerService } from '@/services/customerService';
import { customerSchema } from '@/validations/validators';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    return await CustomerService.getAll(query);
});

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = customerSchema.parse(body);
    return await CustomerService.create(validated);
}, { auth: true });

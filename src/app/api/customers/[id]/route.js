import { apiHandler } from '@/lib/api-handler';
import { CustomerService } from '@/services/customerService';
import { customerSchema } from '@/validations/validators';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    return await CustomerService.getById(id);
});

export const PUT = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const body = await req.json();
    const validated = customerSchema.partial().parse(body);
    return await CustomerService.update(id, validated);
}, { auth: true });

export const DELETE = apiHandler(async (req, { params }) => {
    const { id } = await params;
    return await CustomerService.delete(id);
}, { auth: true });

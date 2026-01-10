import { apiHandler } from '@/lib/core/api-handler';
import { ProductService } from '@/lib/services/productService';
import { productSchema } from '@/lib/core/validators';
import { getCurrentUser } from '@/lib/core/auth';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    return await ProductService.getById(id);
});

export const PUT = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';
    const body = await req.json();
    const validated = productSchema.partial().parse(body);
    return await ProductService.update(id, validated, user.userId);
});

export const DELETE = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') throw 'Forbidden';
    return await ProductService.delete(id);
});

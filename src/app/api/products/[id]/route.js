import { apiHandler } from '@/lib/api-handler';
import { ProductService } from '@/services/productService';
import { productSchema } from '@/validations/validators';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    return await ProductService.getById(id);
});

export const PUT = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const body = await req.json();
    const validated = productSchema.partial().parse(body);
    return await ProductService.update(id, validated, req.user.userId);
}, { auth: true });

export const DELETE = apiHandler(async (req, { params }) => {
    const { id } = await params;
    return await ProductService.delete(id);
}, { roles: ['owner'] });

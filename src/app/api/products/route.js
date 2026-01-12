import { apiHandler } from '@/lib/api-handler';
import { ProductService } from '@/services/productService';
import { productSchema } from '@/validations/validators';
import { getCurrentUser } from '@/lib/auth';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    return await ProductService.getAll(query);
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';
    const body = await req.json();
    const validated = productSchema.parse(body);
    return await ProductService.create(validated, user.userId);
});

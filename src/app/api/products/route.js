import { apiHandler } from '@/lib/core/api-handler';
import { ProductService } from '@/lib/services/productService';
import { productSchema } from '@/lib/core/validators';
import { getCurrentUser } from '@/lib/core/auth';

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

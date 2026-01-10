import { apiHandler } from '@/lib/core/api-handler';
import { ProductService } from '@/lib/services/productService';

export const GET = apiHandler(async () => {
    return await ProductService.getMetadata();
});

import { apiHandler } from '@/lib/api-handler';
import { ProductService } from '@/services/productService';

export const GET = apiHandler(async () => {
    return await ProductService.getMetadata();
});

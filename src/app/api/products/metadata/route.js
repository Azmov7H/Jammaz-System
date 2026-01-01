import { apiHandler } from '@/lib/api-handler';
import Product from '@/models/Product';

export const GET = apiHandler(async () => {
    const brands = await Product.distinct('brand');
    const categories = await Product.distinct('category');

    return {
        brands: brands.filter(Boolean).map(b => ({ label: b, value: b })),
        categories: categories.filter(Boolean).map(c => ({ label: c, value: c }))
    };
});

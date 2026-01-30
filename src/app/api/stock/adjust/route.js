import { apiHandler } from '@/lib/api-handler';
import { StockService } from '@/services/stockService';
import { z } from 'zod';

const stockAdjustSchema = z.object({
    productId: z.string().min(1),
    warehouseQty: z.coerce.number().min(0, 'الكمية لا يمكن أن تكون سالبة'),
    shopQty: z.coerce.number().min(0, 'الكمية لا يمكن أن تكون سالبة'),
    note: z.string().optional().default('Manually Adjusted')
});

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = stockAdjustSchema.parse(body);

    const result = await StockService.adjustStock(
        validated.productId,
        validated.warehouseQty,
        validated.shopQty,
        validated.note,
        req.user.userId
    );

    return result;
}, { roles: ['owner', 'admin', 'manager'] });

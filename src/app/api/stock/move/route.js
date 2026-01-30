import { apiHandler } from '@/lib/api-handler';
import { StockService } from '@/services/stockService';
import { stockMoveSchema } from '@/validations/validators';

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = stockMoveSchema.parse(body);

    if (validated.items && validated.items.length > 0) {
        // Bulk move
        return await StockService.bulkMoveStock({
            items: validated.items,
            type: validated.type,
            userId: req.user.userId
        });
    } else {
        // Single move
        return await StockService.moveStock({
            productId: validated.productId,
            qty: validated.qty,
            type: validated.type,
            userId: req.user.userId,
            note: validated.note
        });
    }
}, { auth: true });

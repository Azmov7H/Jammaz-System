import { apiHandler } from '@/lib/api-handler';
import { StockService } from '@/services/stockService';

export const POST = apiHandler(async (req) => {
    const { productId, quantity, from, to } = await req.json();

    let type = '';
    if (from === 'warehouse' && to === 'shop') {
        type = 'TRANSFER_TO_SHOP';
    } else if (from === 'shop' && to === 'warehouse') {
        type = 'TRANSFER_TO_WAREHOUSE';
    } else {
        throw 'Invalid transfer direction';
    }

    return await StockService.moveStock({
        productId,
        qty: quantity,
        type,
        userId: req.user.userId,
        note: `Transfer: ${from} -> ${to}`
    });
}, { auth: true });

import { apiHandler } from '@/lib/api-handler';
import PhysicalInventory from '@/models/PhysicalInventory';
import StockMovement from '@/models/StockMovement';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;

    const count = await PhysicalInventory.findById(id);
    if (!count) {
        throw 'سجل الجرد غير موجود';
    }

    // Find movements for the products in this count that happened AFTER the count was created
    // and before now (or completion)
    const productIds = count.items.map(i => i.productId);

    const movements = await StockMovement.find({
        productId: { $in: productIds },
        createdAt: { $gt: count.date },
        location: count.location === 'both' ? { $in: ['warehouse', 'shop'] } : count.location
    }).select('productId type qty createdAt');

    // Group by productId
    const summary = {};
    movements.forEach(m => {
        summary[m.productId] = true;
    });

    return { movements: summary };
});

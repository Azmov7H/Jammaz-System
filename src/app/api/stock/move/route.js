import { apiHandler } from '@/lib/api-handler';
import { StockService } from '@/lib/services/stockService';
import { getCurrentUser } from '@/lib/auth';
import { stockMoveSchema } from '@/lib/validators';
import { NextResponse } from 'next/server';

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = stockMoveSchema.parse(body);

    if (validated.items && validated.items.length > 0) {
        // Bulk move
        const result = await StockService.bulkMoveStock({
            items: validated.items,
            type: validated.type,
            userId: user.userId
        });
        return NextResponse.json({ success: true, data: result });
    } else {
        // Single move
        const result = await StockService.moveStock({
            productId: validated.productId,
            qty: validated.qty,
            type: validated.type,
            userId: user.userId,
            note: validated.note
        });
        return NextResponse.json({ success: true, data: result });
    }
});

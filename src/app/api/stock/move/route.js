import { apiHandler } from '@/lib/api-handler';
import { StockService } from '@/lib/services/stockService';
import { stockMoveSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = stockMoveSchema.parse(body);

    if (validated.items) {
        return await StockService.bulkMoveStock({ ...validated, userId: user.userId });
    } else {
        return await StockService.moveStock({ ...validated, userId: user.userId });
    }
});

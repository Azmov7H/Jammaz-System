import { apiHandler } from '@/lib/core/api-handler';
import { StockService } from '@/lib/services/stockService';
import { getCurrentUser } from '@/lib/core/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const stockAdjustSchema = z.object({
    productId: z.string().min(1),
    warehouseQty: z.coerce.number().min(0, 'الكمية لا يمكن أن تكون سالبة'),
    shopQty: z.coerce.number().min(0, 'الكمية لا يمكن أن تكون سالبة'),
    note: z.string().optional().default('Manually Adjusted')
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const canAudit = hasPermission(user.role, 'stock:audit') || user.role === 'manager' || user.role === 'owner';
    if (!canAudit) {
        return NextResponse.json({ success: false, error: 'غير مسموح لك بتعديل المخزون يدوياً' }, { status: 403 });
    }

    const body = await req.json();
    const validated = stockAdjustSchema.parse(body);

    const result = await StockService.adjustStock(
        validated.productId,
        validated.warehouseQty,
        validated.shopQty,
        validated.note,
        user.userId
    );

    return NextResponse.json({ success: true, data: result });
});

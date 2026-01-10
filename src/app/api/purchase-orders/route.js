import { apiHandler } from '@/lib/core/api-handler';
import { PurchaseOrderService } from '@/lib/services/purchaseOrderService';
import { purchaseOrderSchema } from '@/lib/core/validators';
import { getCurrentUser } from '@/lib/core/auth';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || 20);
    const date = await PurchaseOrderService.getAll({ limit });
    return { purchaseOrders: date };
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const body = await req.json();
    const validated = purchaseOrderSchema.parse(body);
    return await PurchaseOrderService.create(validated, user.userId);
});

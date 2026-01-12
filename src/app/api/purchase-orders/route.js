import { apiHandler } from '@/lib/api-handler';
import { PurchaseOrderService } from '@/services/purchaseOrderService';
import { purchaseOrderSchema } from '@/validations/validators';
import { getCurrentUser } from '@/lib/auth';

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

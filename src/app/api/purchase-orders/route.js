import { apiHandler } from '@/lib/api-handler';
import { PurchaseOrderService } from '@/lib/services/purchaseOrderService';
import { purchaseOrderSchema, poReceiveSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || 20);
    const date = await PurchaseOrderService.getAll({ limit });
    return { purchaseOrders: date }; // Matching legacy field name expectation ?
    // Legacy returned { purchaseOrders: [...] }
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = purchaseOrderSchema.parse(body);
    return await PurchaseOrderService.create(validated, user.userId);
});

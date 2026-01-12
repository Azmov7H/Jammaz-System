import { apiHandler } from '@/lib/api-handler';
import { PhysicalInventoryService } from '@/services/physicalInventoryService';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const count = await PhysicalInventoryService.getCountById(id);

    if (!count) {
        throw 'سجل الجرد غير موجود';
    }

    return { count };
});

const updateItemsSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        actualQty: z.coerce.number().min(0),
        reason: z.string().optional(),
        justification: z.string().optional()
    }))
});

export const PATCH = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { id } = await params;
    const body = await req.json();
    const { items } = updateItemsSchema.parse(body);

    const count = await PhysicalInventoryService.updateActualQuantities(id, items, user.userId);
    return { count };
});

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { id } = await params;
    await PhysicalInventoryService.deleteCount(id, user.userId);
    return { message: 'تم الحذف بنجاح' };
});

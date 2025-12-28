import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { InventoryService } from '@/lib/services/inventoryService';
import { hasPermission } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
    try {
        await dbConnect();

        // 1. Auth & RBAC
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const allowed = hasPermission(user.role, 'stock:manage') || hasPermission(user.role, 'transfers:manage');
        if (!allowed) {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }

        // 2. Validate Body
        const body = await request.json();
        const { productId, qty, type, note, items } = body;

        if (!items && (!productId || !qty || !type)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Execute Logic via Service
        try {
            let result;
            if (items && Array.isArray(items)) {
                // Bulk Move
                result = await InventoryService.bulkMoveStock({
                    items,
                    type: type || items[0]?.type,
                    userId: user.userId
                });
            } else {
                // Single Move
                result = await InventoryService.moveStock({
                    productId,
                    qty: Number(qty),
                    type,
                    userId: user.userId,
                    note: note || 'Manual Operation'
                });
            }
            return NextResponse.json(result, { status: 201 });
        } catch (e) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

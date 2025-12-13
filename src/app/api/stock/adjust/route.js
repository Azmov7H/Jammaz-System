import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { InventoryService } from '@/lib/services/inventoryService';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function POST(request) {
    try {
        await dbConnect();

        // 1. Auth & RBAC
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Requires high-level permission for audit/correction
        const canAudit = hasPermission(user.role, 'stock:audit') || user.role === 'manager' || user.role === 'owner';

        if (!canAudit) {
            return NextResponse.json({ error: 'Forbidden: Requires Audit Permissions' }, { status: 403 });
        }

        // 2. Validate Body
        const { productId, warehouseQty, shopQty, note } = await request.json();

        if (!productId || warehouseQty === undefined || shopQty === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (Number(warehouseQty) < 0 || Number(shopQty) < 0) {
            return NextResponse.json({ error: 'Quantities cannot be negative' }, { status: 400 });
        }

        // 3. Execute
        const result = await InventoryService.forceAdjust(
            productId,
            Number(warehouseQty),
            Number(shopQty),
            user.userId,
            note || 'Manual Correction'
        );

        return NextResponse.json(result);

    } catch (error) {
        console.error('Audit Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

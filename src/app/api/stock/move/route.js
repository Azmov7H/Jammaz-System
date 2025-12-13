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
        const { productId, qty, type, note } = await request.json();

        if (!productId || !qty || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Execute Logic via Service
        // Note: The UI might send legacy types, so we might need mapping if we strictly enforced new types.
        // But the previous file seemed to match closely except 'SALE' mapping.

        try {
            const result = await InventoryService.moveStock({
                productId,
                qty: Number(qty),
                type,
                userId: user.userId, // JWT payload usually has userId (check lib/auth signToken!)
                // Wait, signToken uses userId. VerifyToken returns payload.
                // In my new auth.js I just use verifying.
                // Previous login route used `userId`. I need to be careful.
                note: note || 'Manual Operation'
            });
            return NextResponse.json(result, { status: 201 });
        } catch (e) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

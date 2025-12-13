import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { processTreasuryTransaction } from '@/lib/treasury';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
    try {
        await dbConnect();
        const user = await verifyToken(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { amount, type, description } = await request.json();

        if (!amount || !type || !description) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        await processTreasuryTransaction({
            amount: Number(amount),
            type,
            description,
            referenceType: 'Manual',
            referenceId: null,
            userId: user.id
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

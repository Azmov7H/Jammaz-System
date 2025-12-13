import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Treasury from '@/models/Treasury';
import TreasuryTransaction from '@/models/TreasuryTransaction';

export async function GET() {
    try {
        await dbConnect();

        let treasury = await Treasury.findOne();
        if (!treasury) {
            treasury = await Treasury.create({ balance: 0 });
        }

        const transactions = await TreasuryTransaction.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('createdBy', 'name');

        return NextResponse.json({
            balance: treasury.balance,
            transactions
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

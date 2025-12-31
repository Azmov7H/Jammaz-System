import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DebtService } from '@/lib/services/debtService';

export async function GET() {
    try {
        await dbConnect();
        const overview = await DebtService.getDebtOverview();
        return NextResponse.json(overview);
    } catch (error) {
        console.error('Error in Debt API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

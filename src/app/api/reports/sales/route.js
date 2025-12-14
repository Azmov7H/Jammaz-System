import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DailySalesService } from '@/lib/services/dailySalesService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token || !verifyToken(token)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : new Date();

        const summary = await DailySalesService.getSalesSummary(startDate, endDate);

        return NextResponse.json(summary);
    } catch (error) {
        console.error('Sales Report Error:', error);
        return NextResponse.json({ error: 'Failed to fetch sales report' }, { status: 500 });
    }
}

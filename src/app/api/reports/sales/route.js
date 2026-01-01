import { apiHandler } from '@/lib/api-handler';
import { DailySalesService } from '@/lib/services/dailySalesService';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : new Date();

    return await DailySalesService.getSalesSummary(startDate, endDate);
});

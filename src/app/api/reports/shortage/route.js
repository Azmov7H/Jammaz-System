import { apiHandler } from '@/lib/api-handler';
import { ReportingService } from '@/services/reportingService';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const reports = await ReportingService.getShortageReports(status);
    return { reports };
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    return await ReportingService.createShortageReport({
        product: body.productId,
        productName: body.productName,
        requestedQty: body.requestedQty,
        availableQty: body.availableQty,
        notes: body.notes
    }, user.userId, user.name || 'Unknown');
});

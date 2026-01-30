import { apiHandler } from '@/lib/api-handler';
import { ReportingService } from '@/services/reportingService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const reports = await ReportingService.getShortageReports(status);
    return { reports };
}, { auth: true });

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    return await ReportingService.createShortageReport({
        product: body.productId,
        productName: body.productName,
        requestedQty: body.requestedQty,
        availableQty: body.availableQty,
        notes: body.notes
    }, req.user.userId, req.user.name || 'Unknown');
}, { auth: true });

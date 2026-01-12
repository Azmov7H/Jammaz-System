import { apiHandler } from '@/lib/api-handler';
import { ReportingService } from '@/services/reportingService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const productId = searchParams.get('productId');

    const history = await ReportingService.getPriceHistory(productId, limit);
    return { history };
});

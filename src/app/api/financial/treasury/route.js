import { apiHandler } from '@/lib/api-handler';
import { TreasuryService } from '@/lib/services/treasuryService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (date) {
        return await TreasuryService.getDailyCashbox(new Date(date));
    } else {
        return {
            balance: await TreasuryService.getCurrentBalance()
        };
    }
});

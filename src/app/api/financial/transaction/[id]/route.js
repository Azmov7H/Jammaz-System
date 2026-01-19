import { apiHandler } from '@/lib/api-handler';
import { TreasuryService } from '@/services/treasuryService';
import { getCurrentUser } from '@/lib/auth';

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { id } = await params;
    return await TreasuryService.undoTransaction(id, user.userId);
});

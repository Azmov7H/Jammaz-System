import { apiHandler } from '@/lib/api-handler';
import { LogService } from '@/services/logService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    const logs = await LogService.getAll({ limit, page });
    return { logs };
}, { roles: ['owner'] });

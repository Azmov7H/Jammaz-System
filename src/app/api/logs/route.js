import { apiHandler } from '@/lib/api-handler';
import { LogService } from '@/lib/services/logService';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    const logs = await LogService.getAll({ limit, page });
    return { logs };
});

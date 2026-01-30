import { apiHandler } from '@/lib/api-handler';
import { PhysicalInventoryService } from '@/services/physicalInventoryService';
import { z } from 'zod';

const createCountSchema = z.object({
    location: z.enum(['warehouse', 'shop', 'both']),
    category: z.string().optional().nullable(),
    isBlind: z.boolean().optional().default(false)
});

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = createCountSchema.parse(body);

    return await PhysicalInventoryService.createCount(
        validated.location,
        req.user.userId,
        { category: validated.category, isBlind: validated.isBlind }
    );
}, { auth: true });

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const filters = {
        location: searchParams.get('location'),
        status: searchParams.get('status'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate')
    };

    const counts = await PhysicalInventoryService.getCounts(filters);
    return { counts };
}, { auth: true });

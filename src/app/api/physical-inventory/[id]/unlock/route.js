import { apiHandler } from '@/lib/api-handler';
import { PhysicalInventoryService } from '@/lib/services/physicalInventoryService';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const unlockSchema = z.object({
    password: z.string().min(1, 'كلمة المرور مطلوبة')
});

export const POST = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { password } = unlockSchema.parse(body);

    const count = await PhysicalInventoryService.unlockCount(id, password, user.userId);

    return {
        success: true,
        message: 'تم فتح الجرد للتعديل بنجاح',
        count
    };
});

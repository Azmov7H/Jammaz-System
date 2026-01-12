import { apiHandler } from '@/lib/api-handler';
import { PhysicalInventoryService } from '@/services/physicalInventoryService';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const unlockSchema = z.object({
    password: z.string().min(1, 'كلمة المرور مطلوبة')
});

export const POST = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { id } = await params;
    const body = await req.json();
    const { password } = unlockSchema.parse(body);

    const count = await PhysicalInventoryService.unlockCount(id, password, user.userId);

    return {
        message: 'تم فتح الجرد للتعديل بنجاح',
        count
    };
});

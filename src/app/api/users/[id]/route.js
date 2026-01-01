import { apiHandler } from '@/lib/api-handler';
import { UserService } from '@/lib/services/userService';
import { getCurrentUser } from '@/lib/auth';
import { updateUserSchema } from '@/lib/validators';
import { NextResponse } from 'next/server';

export const PUT = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = updateUserSchema.parse(body);
    return await UserService.update(params.id, validated);
});

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return await UserService.delete(params.id);
});

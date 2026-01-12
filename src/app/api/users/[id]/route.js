import { apiHandler } from '@/lib/api-handler';
import { UserService } from '@/services/userService';
import { getCurrentUser } from '@/lib/auth';
import { updateUserSchema } from '@/validations/validators';
import { NextResponse } from 'next/server';

export const PUT = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    console.log('DEBUG: Updating user', id, 'Body:', body);
    const validated = updateUserSchema.parse(body);
    console.log('DEBUG: Validated data:', validated);
    return await UserService.update(id, validated);
});

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    return await UserService.delete(id);
});

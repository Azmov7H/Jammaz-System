import { apiHandler } from '@/lib/api-handler';
import { UserService } from '@/services/userService';
import { updateUserSchema } from '@/validations/validators';

export const PUT = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const body = await req.json();
    const validated = updateUserSchema.parse(body);
    return await UserService.update(id, validated);
}, { roles: ['owner'] });

export const DELETE = apiHandler(async (req, { params }) => {
    const { id } = await params;
    return await UserService.delete(id);
}, { roles: ['owner'] });

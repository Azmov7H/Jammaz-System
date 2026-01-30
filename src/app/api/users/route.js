import { apiHandler } from '@/lib/api-handler';
import { UserService } from '@/services/userService';
import { userSchema } from '@/validations/validators';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    const users = await UserService.getAll(query);
    return { users };
}, { roles: ['owner'] });

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = userSchema.parse(body);
    return await UserService.create(validated);
}, { roles: ['owner'] });

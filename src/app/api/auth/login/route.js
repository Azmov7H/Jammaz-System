import { apiHandler } from '@/lib/api-handler';
import { AuthService } from '@/services/authService';
import { loginSchema } from '@/validations/validators';

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = loginSchema.parse(body);
    return await AuthService.login(validated);
});

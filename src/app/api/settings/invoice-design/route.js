import { apiHandler } from '@/lib/api-handler';
import InvoiceSettings from '@/models/InvoiceSettings';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';

export const GET = apiHandler(async () => {
    return await InvoiceSettings.getSettings();
}, { auth: true });

export const POST = apiHandler(async (req) => {
    const body = await req.json();

    // Use getSettingsBase() to get the live Mongoose document
    const settings = await InvoiceSettings.getSettingsBase();

    // Update fields
    Object.assign(settings, body);
    await settings.save();

    // Revalidate cache
    revalidateTag(CACHE_TAGS.SETTINGS);

    return { success: true, settings };
}, { roles: ['owner', 'admin', 'manager'] });

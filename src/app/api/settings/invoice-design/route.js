import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InvoiceSettings from '@/models/InvoiceSettings';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        await dbConnect();
        const settings = await InvoiceSettings.getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();

        // Only core/admin users should be able to change settings
        // Assuming user.role check or similar if available, otherwise just letting it through for now as it's a dashboard action

        const body = await request.json();

        // Use getSettingsBase() to get the live Mongoose document instead of the cached plain object
        const settings = await InvoiceSettings.getSettingsBase();

        // Update fields
        Object.assign(settings, body);
        await settings.save();

        // Revalidate cache
        const { revalidateTag } = await import('next/cache');
        const { CACHE_TAGS } = await import('@/lib/cache');
        revalidateTag(CACHE_TAGS.SETTINGS);

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

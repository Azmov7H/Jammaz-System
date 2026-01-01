import { apiHandler } from '@/lib/api-handler';
import { InvoiceService } from '@/lib/services/invoiceService';
import { invoiceSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    return await InvoiceService.getAll(query);
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = invoiceSchema.parse(body);

    try {
        const invoice = await InvoiceService.create(validated, user.userId);
        return NextResponse.json({
            success: true,
            data: {
                invoice,
                message: validated.paymentType === 'cash' ? 'تم إنشاء الفاتورة بنجاح' : 'تم إنشاء فاتورة آجلة بنجاح'
            }
        }, { status: 201 });
    } catch (e) {
        // Handle specific service errors (like stock unavailable returning object)
        if (typeof e === 'object' && e.unavailableItems) {
            return NextResponse.json({
                success: false,
                error: e.message,
                unavailableItems: e.unavailableItems
            }, { status: 400 });
        }
        throw e;
    }
});

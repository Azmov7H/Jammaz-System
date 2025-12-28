import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import InvoiceSettings from '@/models/InvoiceSettings';
import { LogService } from '@/lib/services/logService';

export async function POST(req) {
    try {
        await dbConnect();
        const { customerId, points } = await req.json();

        if (!customerId || !points || points <= 0) {
            return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
        }

        if (customer.loyaltyPoints < points) {
            return NextResponse.json({ error: 'نقاط غير كافية' }, { status: 400 });
        }

        const settings = await InvoiceSettings.getSettings();
        const creditToAdd = Math.floor(points * (settings.egpPerPoint || 0.1));

        customer.loyaltyPoints -= points;
        customer.creditBalance = (customer.creditBalance || 0) + creditToAdd;
        await customer.save();

        await LogService.logAction({
            userId: req.headers.get('x-user-id') || 'system',
            action: 'REDEEM_LOYALTY_POINTS',
            entity: 'Customer',
            entityId: customerId,
            diff: { points, creditAdded: creditToAdd },
            note: `تم استبدال ${points} نقطة بـ ${creditToAdd} ج.م رصيد`
        });

        return NextResponse.json({
            success: true,
            newPoints: customer.loyaltyPoints,
            newCreditBalance: customer.creditBalance
        });

    } catch (error) {
        console.error('Loyalty Redemption Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

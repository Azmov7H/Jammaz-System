import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import Invoice from '@/models/Invoice';
import PurchaseOrder from '@/models/PurchaseOrder';
import Supplier from '@/models/Supplier';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { notificationId } = await request.json();
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        const { actionType, relatedId } = notification;

        if (!actionType || !relatedId) {
            return NextResponse.json({ error: 'Notification is not actionable' }, { status: 400 });
        }

        let result;

        if (actionType === 'COLLECT_DEBT') {
            const invoice = await Invoice.findById(relatedId);
            if (!invoice) throw new Error('Invoice not found');
            if (invoice.paymentStatus === 'paid') throw new Error('Invoice already paid');

            // Record full remaining payment
            const amountToPay = invoice.total - invoice.paidAmount;

            // Execute via centralized FinanceService
            const { FinanceService } = await import('@/lib/services/financeService');
            await FinanceService.recordCustomerPayment(invoice, amountToPay, 'cash', 'تحصيل سريع من الإشعارات', user.userId);

            result = { success: true, message: 'تم التحصيل بنجاح' };
        }
        else if (actionType === 'PAY_SUPPLIER') {
            const po = await PurchaseOrder.findById(relatedId).populate('items.productId');
            if (!po) throw new Error('Purchase Order not found');
            if (po.status === 'RECEIVED') throw new Error('Order already received');

            // Receive PO via FinanceService (Assuming cash for quick action)
            const { FinanceService } = await import('@/lib/services/financeService');
            await FinanceService.recordPurchaseReceive(po, user.userId, 'cash');

            result = { success: true, message: 'تم التوريد والسداد بنجاح' };
        }

        // Mark notification as read after successful action
        notification.isRead = true;
        await notification.save();

        return NextResponse.json(result);

    } catch (error) {
        console.error('Notification Action Error:', error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}

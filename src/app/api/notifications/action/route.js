import { apiHandler } from '@/lib/api-handler';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import Invoice from '@/models/Invoice';
import PurchaseOrder from '@/models/PurchaseOrder';
import { getCurrentUser } from '@/lib/auth';

export const POST = apiHandler(async (request) => {
    await dbConnect();
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const { notificationId } = await request.json();
    const notification = await Notification.findById(notificationId);

    if (!notification) throw new Error('Notification not found');

    const { actionType, relatedId } = notification;

    if (!actionType || !relatedId) throw new Error('Notification is not actionable');

    let result;

    if (actionType === 'COLLECT_DEBT') {
        const invoice = await Invoice.findById(relatedId);
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.paymentStatus === 'paid') throw new Error('Invoice already paid');

        const amountToPay = invoice.total - invoice.paidAmount;
        const { FinanceService } = await import('@/lib/services/financeService');
        await FinanceService.recordCustomerPayment(invoice, amountToPay, 'cash', 'تحصيل سريع من الإشعارات', user.userId);
        result = { success: true, message: 'تم التحصيل بنجاح' };
    }
    else if (actionType === 'PAY_SUPPLIER') {
        const po = await PurchaseOrder.findById(relatedId).populate('items.productId');
        if (!po) throw new Error('Purchase Order not found');
        if (po.status === 'RECEIVED') throw new Error('Order already received');

        const { FinanceService } = await import('@/lib/services/financeService');
        await FinanceService.recordPurchaseReceive(po, user.userId, 'cash');
        result = { success: true, message: 'تم التوريد والسداد بنجاح' };
    }

    notification.isRead = true;
    await notification.save();

    return result;
});

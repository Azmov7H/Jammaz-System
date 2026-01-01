import { apiHandler } from '@/lib/api-handler';
import { FinanceService } from '@/lib/services/financeService';
import { getCurrentUser } from '@/lib/auth';
import Invoice from '@/models/Invoice';
import PurchaseOrder from '@/models/PurchaseOrder';
import { NextResponse } from 'next/server';

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, id, amount, method = 'cash', note = '' } = body;

    if (!type || !id || !amount || amount <= 0) {
        throw 'بيانات غير صحيحة';
    }

    if (type === 'receivable') {
        const invoice = await Invoice.findById(id).populate('customer');
        if (!invoice) throw 'الفاتورة غير موجودة';

        await FinanceService.recordCustomerPayment(invoice, amount, method, note, user.userId);
        return { success: true, message: 'تم تحصيل الدفعة بنجاح' };

    } else if (type === 'payable') {
        const po = await PurchaseOrder.findById(id).populate('supplier');
        if (!po) throw 'أمر الشراء غير موجود';

        await FinanceService.recordSupplierPayment(po, amount, method, note, user.userId);
        return { success: true, message: 'تم سداد الدفعة للمورد بنجاح' };
    }

    throw 'نوع عملية غير معروف';
});

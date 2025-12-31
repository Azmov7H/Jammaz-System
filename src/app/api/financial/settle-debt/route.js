import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import PurchaseOrder from '@/models/PurchaseOrder';
import { FinanceService } from '@/lib/services/financeService';
import { getCurrentUser } from '@/lib/auth';

/**
 * Unified Settlement API
 * Handles recording payments for both Customer Invoices and Supplier Purchase Orders.
 */
export async function POST(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { type, id, amount, method = 'cash', note = '' } = body;

        if (!type || !id || !amount || amount <= 0) {
            return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
        }

        if (type === 'receivable') {
            // Customer Debt Settlement
            const invoice = await Invoice.findById(id).populate('customer');
            if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

            const remaining = invoice.total - invoice.paidAmount;
            if (amount > remaining) {
                return NextResponse.json({ error: `المبلغ أكبر من المتبقي (${remaining})` }, { status: 400 });
            }

            await FinanceService.recordCustomerPayment(invoice, amount, method, note, user.userId);
            return NextResponse.json({ success: true, message: 'تم تحصيل الدفعة بنجاح' });

        } else if (type === 'payable') {
            // Supplier Debt Settlement
            const po = await PurchaseOrder.findById(id).populate('supplier');
            if (!po) return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 });

            const remaining = po.totalCost - (po.paidAmount || 0);
            if (amount > remaining) {
                return NextResponse.json({ error: `المبلغ أكبر من المتبقي (${remaining})` }, { status: 400 });
            }

            await FinanceService.recordSupplierPayment(po, amount, method, note, user.userId);
            return NextResponse.json({ success: true, message: 'تم سداد الدفعة للمورد بنجاح' });

        } else {
            return NextResponse.json({ error: 'نوع عملية غير معروف' }, { status: 400 });
        }

    } catch (error) {
        console.error('Settlement API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

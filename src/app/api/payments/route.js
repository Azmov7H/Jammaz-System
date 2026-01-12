import { apiHandler } from '@/lib/api-handler';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import { getCurrentUser } from '@/lib/auth';

export const POST = apiHandler(async (request) => {
    await dbConnect();
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const body = await request.json();
    const { invoiceId, amount, method = 'cash', note = '' } = body;

    // Validation
    if (!invoiceId || !amount || amount <= 0) {
        throw new Error('بيانات غير صحيحة');
    }

    // Get invoice
    const invoice = await Invoice.findById(invoiceId).populate('customer');
    if (!invoice) {
        throw new Error('الفاتورة غير موجودة');
    }

    // Check if already paid
    if (invoice.paymentStatus === 'paid') {
        throw new Error('الفاتورة مدفوعة بالكامل');
    }

    // Calculate remaining balance
    const remainingBalance = invoice.total - invoice.paidAmount;

    // Validate payment amount
    if (amount > remainingBalance) {
        throw new Error(`المبلغ أكبر من المتبقي. المتبقي: ${remainingBalance}`);
    }

    // 5. Execute Business Logic via centralized FinanceService
    const { FinanceService } = await import('@/services/financeService');
    await FinanceService.recordCustomerPayment(invoice, amount, method, note, user.userId);

    return {
        invoice,
        message: 'تم تسجيل الدفعة بنجاح',
        remainingBalance: invoice.total - invoice.paidAmount
    };
});

export const GET = apiHandler(async (request) => {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, partial
    const customerId = searchParams.get('customerId');

    const query = { paymentType: 'credit' };

    if (status) {
        query.paymentStatus = status;
    } else {
        // Default: show unpaid and partial
        query.paymentStatus = { $in: ['pending', 'partial'] };
    }

    if (customerId) {
        query.customer = customerId;
    }

    const invoices = await Invoice.find(query)
        .populate('customer', 'name phone balance')
        .populate('createdBy', 'name')
        .sort({ date: -1 })
        .lean();

    // Calculate total receivables
    const totalReceivables = invoices.reduce((sum, inv) => {
        return sum + (inv.total - inv.paidAmount);
    }, 0);

    return {
        invoices,
        totalReceivables,
        count: invoices.length
    };
});

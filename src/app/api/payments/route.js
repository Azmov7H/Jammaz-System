import { apiHandler } from '@/lib/api-handler';
import Invoice from '@/models/Invoice';
import { FinanceService } from '@/services/financeService';

export const POST = apiHandler(async (request) => {
    const body = await request.json();
    const { invoiceId, amount, method = 'cash', note = '' } = body;

    // Validation
    if (!invoiceId || !amount || amount <= 0) {
        throw 'بيانات غير صحيحة';
    }

    // Get invoice
    const invoice = await Invoice.findById(invoiceId).populate('customer');
    if (!invoice) {
        throw 'الفاتورة غير موجودة';
    }

    // Check if already paid
    if (invoice.paymentStatus === 'paid') {
        throw 'الفاتورة مدفوعة بالكامل';
    }

    // Calculate remaining balance
    const remainingBalance = invoice.total - invoice.paidAmount;

    // Validate payment amount
    if (amount > remainingBalance) {
        throw `المبلغ أكبر من المتبقي. المتبقي: ${remainingBalance}`;
    }

    // Execute Business Logic
    const result = await FinanceService.recordCustomerPayment(invoice, amount, method, note, req.user.userId);

    return {
        success: true,
        invoice: result.invoice,
        transaction: result.transaction,
        message: 'تم تسجيل الدفعة بنجاح',
        remainingBalance: result.invoice.total - result.invoice.paidAmount
    };
}, { auth: true });

export const GET = apiHandler(async (request) => {
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
}, { auth: true });

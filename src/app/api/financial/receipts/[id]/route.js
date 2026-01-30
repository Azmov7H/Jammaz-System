import { apiHandler } from '@/lib/api-handler';
import TreasuryTransaction from '@/models/TreasuryTransaction';
import InvoiceSettings from '@/models/InvoiceSettings';
import Customer from '@/models/Customer';
import Invoice from '@/models/Invoice';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;

    const transaction = await TreasuryTransaction.findById(id)
        .populate('createdBy', 'name')
        .lean();

    if (!transaction) {
        throw 'Transaction not found';
    }

    // Fetch Customer details if partnerId exists
    let partner = null;
    if (transaction.partnerId) {
        partner = await Customer.findById(transaction.partnerId).lean();
    }

    // Fetch Company Settings for Header
    const settings = await InvoiceSettings.getSettings();

    // Fetch remaining balance for the associated entity
    let remainingBalance = 0;
    if (transaction.meta?.customerBalanceAfter !== undefined) {
        remainingBalance = transaction.meta.customerBalanceAfter;
    } else if (transaction.referenceType === 'Invoice') {
        const invoice = await Invoice.findById(transaction.referenceId).lean();
        if (invoice) remainingBalance = invoice.total - invoice.paidAmount;
    } else if (transaction.referenceType === 'Debt') {
        const { default: Debt } = await import('@/models/Debt');
        const debt = await Debt.findById(transaction.referenceId).lean();
        if (debt) remainingBalance = debt.remainingAmount;
    } else if (transaction.referenceType === 'UnifiedCollection') {
        // For unified collections, get current customer balance as fallback
        if (partner) {
            remainingBalance = partner.balance || 0;
        } else if (transaction.partnerId) {
            const customer = await Customer.findById(transaction.partnerId).lean();
            if (customer) remainingBalance = customer.balance || 0;
        }
    }

    return {
        transaction,
        partner,
        settings,
        remainingBalance
    };
}, { auth: true });

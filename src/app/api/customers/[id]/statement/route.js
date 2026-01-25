import { apiHandler } from '@/lib/api-handler';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import TreasuryTransaction from '@/models/TreasuryTransaction';
import Customer from '@/models/Customer';

export const GET = apiHandler(async (req, { params }) => {
    await dbConnect();
    const { id } = await params;

    const customer = await Customer.findById(id).lean();
    if (!customer) throw 'العميل غير موجود';

    // 1. Fetch Invoices
    const invoices = await Invoice.find({ customer: id }).sort({ date: 1 }).lean();
    const invoiceIds = invoices.map(inv => inv._id);

    // 2. Fetch Debt records (Manual/Opening Balance)
    const { default: Debt } = await import('@/models/Debt');
    const debts = await Debt.find({ debtorId: id, debtorType: 'Customer' }).sort({ createdAt: 1 }).lean();
    const debtIds = debts.map(d => d._id);

    // 3. Fetch Treasury Transactions (Payments/Refunds)
    const payments = await TreasuryTransaction.find({
        $or: [
            { partnerId: id },
            { referenceId: { $in: invoiceIds }, referenceType: 'Invoice' },
            { referenceId: { $in: debtIds }, referenceType: 'Debt' },
            { referenceId: id, referenceType: 'Manual' }
        ]
    }).sort({ date: 1 }).lean();

    // 4. Merge and Sort
    const statement = [];

    // Add Invoices as Debit entries
    invoices.forEach(inv => {
        statement.push({
            date: inv.date,
            type: 'SALES',
            label: `فاتورة مبيعات #${inv.number}`,
            reference: inv.number,
            referenceId: inv._id,
            referenceType: 'Invoice',
            debit: inv.total,
            credit: 0
        });
    });

    // Add Manual Debts (Opening Balance etc) as Debit entries
    // Filter out debts that are already linked to invoices to avoid double counting
    debts.filter(d => d.referenceType !== 'Invoice').forEach(d => {
        statement.push({
            date: d.createdAt,
            type: 'DEBT_START',
            label: d.description || 'مديونية سابقة / رصيد افتتاحي',
            reference: 'Manual',
            referenceId: d._id,
            referenceType: 'Debt',
            debit: d.originalAmount,
            credit: 0
        });
    });

    // Add Payments as Credit/Debit entries
    payments.forEach(tx => {
        // Avoid duplicating invoice creation (if somehow recorded as income)
        // RecordSaleIncome records the PAID amount for cash sales.
        // For a Statement of Account, typically:
        // Invoice Entry: Debit Total
        // Payment Entry: Credit Paid Amount

        // If it's RecordSaleIncome, it might be the initial cash payment
        // Let's identify the types
        let label = tx.description;
        let debit = 0;
        let credit = 0;

        if (tx.type === 'INCOME') {
            credit = tx.amount;
        } else {
            debit = tx.amount;
        }

        // If it's a RecordSaleIncome, it's the payment made AT the time of invoice.
        // We want to show it as a separate credit line.

        statement.push({
            date: tx.date,
            type: tx.type === 'INCOME' ? 'PAYMENT' : 'REFUND',
            label: label,
            reference: tx.referenceId?.toString() || '---',
            referenceId: tx._id, // Link to the TreasuryTransaction itself (the receipt)
            originalReferenceId: tx.referenceId, // Keep original reference (Invoice/Debt)
            referenceType: tx.referenceType,
            debit,
            credit
        });
    });

    // Sort by date
    statement.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate Running Balance
    // Starting balance should ideally be handled by an "Opening Balance" entry if it exists in Debt or similar
    // For now, we assume the statement starts from zero or the first entry.

    let runningBalance = 0;
    const statementWithBalance = statement.map(entry => {
        runningBalance += (entry.debit - entry.credit);
        return { ...entry, balance: runningBalance };
    });

    return {
        customer: {
            name: customer.name,
            balance: customer.balance
        },
        statement: statementWithBalance.reverse() // Newest first for UI
    };
});

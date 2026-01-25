import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TreasuryTransaction from '@/models/TreasuryTransaction';
import InvoiceSettings from '@/models/InvoiceSettings';
import Customer from '@/models/Customer';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;

        const transaction = await TreasuryTransaction.findById(id)
            .populate('createdBy', 'name')
            .lean();

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
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
        if (transaction.referenceType === 'Invoice') {
            const invoice = await Invoice.findById(transaction.referenceId).lean();
            if (invoice) remainingBalance = invoice.total - invoice.paidAmount;
        } else if (transaction.referenceType === 'Debt') {
            const { default: Debt } = await import('@/models/Debt');
            const debt = await Debt.findById(transaction.referenceId).lean();
            if (debt) remainingBalance = debt.remainingAmount;
        }

        return NextResponse.json({
            success: true,
            data: {
                transaction,
                partner,
                settings,
                remainingBalance
            }
        });
    } catch (error) {
        console.error('Receipt API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

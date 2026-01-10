import mongoose from 'mongoose';
import Payment from '@/models/Payment';
import Debt from '@/models/Debt';
import { DebtService } from './debtService';
import { AccountingService, ACCOUNTS } from '@/lib/services/accountingService';
import dbConnect from '@/lib/db';

export class PaymentService {

    /**
     * Record a new payment
     */
    static async recordPayment({
        debtId,
        amount,
        method,
        referenceNumber,
        notes,
        recordedBy,
        date = new Date()
    }) {
        await dbConnect();

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Fetch Debt
            const debt = await Debt.findById(debtId).session(session);
            if (!debt) throw new Error('Debt not found');

            // 2. Validate Amount
            // Allow 1.05 limit (5% overpayment tolerance? No, strict for now)
            if (amount <= 0) throw new Error('Payment amount must be positive');
            if (amount > debt.remainingAmount + 0.01) { // 0.01 tolerance
                throw new Error(`Amount exceeds remaining debt (${debt.remainingAmount})`);
            }

            // 3. Create Payment Record
            const payment = await Payment.create([{
                debtId,
                amount,
                method,
                referenceNumber,
                notes,
                recordedBy,
                date,
                status: 'completed'
            }], { session });

            // 4. Update Debt Balance
            // We use the service logic but need to pass session or implement logic inline suitable for txn
            // Since DebtService doesn't accept session yet, let's do inline modification for safety
            debt.remainingAmount -= amount;

            if (debt.remainingAmount <= 0.01) {
                debt.remainingAmount = 0;
                debt.status = 'settled';
            }

            await debt.save({ session });

            // 4.5 Update Payment Schedules (New: Link installments to payments)
            const { default: PaymentSchedule } = await import('@/models/PaymentSchedule');
            const schedules = await PaymentSchedule.find({
                debtId,
                status: { $in: ['PENDING', 'OVERDUE'] }
            }).sort({ dueDate: 1 }).session(session);

            let remainingForSchedule = amount;
            for (const schedule of schedules) {
                if (remainingForSchedule <= 0) break;

                if (remainingForSchedule >= schedule.amount) {
                    remainingForSchedule -= schedule.amount;
                    schedule.status = 'PAID';
                    schedule.notes = (schedule.notes || '') + ` (تم السداد بالعملية #${payment[0]._id.toString().slice(-6)})`;
                    await schedule.save({ session });
                } else {
                    schedule.amount -= remainingForSchedule;
                    schedule.notes = (schedule.notes || '') + ` (سداد جزئي ${remainingForSchedule.toLocaleString()} د.ل)`;
                    remainingForSchedule = 0;
                    await schedule.save({ session });
                }
            }

            // 5. Accounting Entries
            // Determine accounts based on Debtor Type
            if (debt.debtorType === 'Customer') {
                // Customer Payment: Debit Cash/Bank, Credit Receivables
                const debitAccount = ['bank_transfer', 'check', 'credit_card'].includes(method)
                    ? ACCOUNTS.BANK
                    : ACCOUNTS.CASH;

                // We can't reuse AccountingService directly if it doesn't support sessions easily without modification.
                // However, AccountingService uses `createEntry` which likely just does `AccountingEntry.create`.
                // For now, we assume implicit session isn't propagated unless we modify generic createEntry.
                // To keep it simple and safe, we can run accounting AFTER the main transaction commit 
                // OR we accept that accounting might slightly lag if this crashes between steps.
                // Ideally, pass session to everything. 
                // Let's rely on success of this block, then trigger accounting.

                await AccountingService.createPaymentEntries({
                    _id: debt.referenceId, // Linking to Invoice/Ref
                    number: 'N/A' // Placeholder
                }, amount, recordedBy, date);

            } else if (debt.debtorType === 'Supplier') {
                // Supplier Payment: Debit Payables, Credit Cash/Bank
                // Handled similarly
                await AccountingService.createSupplierPaymentEntries({
                    _id: debt.referenceId,
                    poNumber: 'N/A',
                    paymentType: method === 'cash' ? 'cash' : 'bank'
                }, amount, recordedBy, date);
            }

            await session.commitTransaction();
            return payment[0];

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get Payments for a specific debt
     */
    static async getDebtPayments(debtId) {
        await dbConnect();
        return await Payment.find({ debtId, status: 'completed' })
            .sort({ date: -1 })
            .populate('recordedBy', 'name')
            .lean();
    }
}

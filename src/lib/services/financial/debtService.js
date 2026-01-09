import Debt from '@/models/Debt';
import dbConnect from '@/lib/db';

export class DebtService {
    /**
     * Create a new debt record
     */
    static async createDebt({
        debtorType,
        debtorId,
        amount,
        dueDate,
        referenceType,
        referenceId,
        description,
        createdBy
    }) {
        await dbConnect();

        // 1. Validation
        if (amount <= 0) {
            throw new Error('Debt amount must be greater than zero');
        }

        // 2. duplication check (same reference)
        const existing = await Debt.findOne({ referenceType, referenceId, debtorType, debtorId });
        if (existing) {
            console.log(`Debt already exists for ${referenceType} ${referenceId}`);
            return existing;
        }

        // 3. Create
        const debt = await Debt.create({
            debtorType,
            debtorId,
            originalAmount: amount,
            remainingAmount: amount, // Starts full
            dueDate: new Date(dueDate),
            referenceType,
            referenceId,
            description,
            status: 'active',
            createdBy
        });

        return debt;
    }

    /**
     * Get Debts with filtering
     */
    static async getDebts(filter = {}, { page = 1, limit = 20 } = {}) {
        await dbConnect();
        const skip = (page - 1) * limit;

        const query = {};
        if (filter.debtorId) query.debtorId = filter.debtorId;
        if (filter.debtorType) query.debtorType = filter.debtorType;
        if (filter.status) query.status = filter.status;
        if (filter.startDate && filter.endDate) {
            query.dueDate = { $gte: new Date(filter.startDate), $lte: new Date(filter.endDate) };
        }

        const [debts, total] = await Promise.all([
            Debt.find(query)
                .sort({ dueDate: 1 }) // Earliest due first
                .skip(skip)
                .limit(limit)
                .populate('debtorId', 'name phone') // simplified populate
                .lean(),
            Debt.countDocuments(query)
        ]);

        return {
            debts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get Debt by ID
     */
    static async getDebtById(id) {
        await dbConnect();
        return await Debt.findById(id).populate('debtorId', 'name phone email').lean();
    }

    /**
     * Update remaining amount (Internal use by PaymentService)
     */
    static async updateBalance(id, amountPaid) {
        await dbConnect();
        const debt = await Debt.findById(id);
        if (!debt) throw new Error('Debt not found');

        debt.remainingAmount -= amountPaid;

        // Auto-settlement
        if (debt.remainingAmount <= 0.01) { // 0.01 tolerance
            debt.remainingAmount = 0;
            debt.status = 'settled';
        } else if (debt.status === 'settled') {
            // Re-open if balance becomes positive (e.g. payment reversal)
            debt.status = debt.dueDate < new Date() ? 'overdue' : 'active';
        }

        await debt.save();
        return debt;
    }

    /**
     * Write-off debt (Bad Debt)
     */
    static async writeOff(id, reason, userId) {
        await dbConnect();
        const debt = await Debt.findById(id);
        if (!debt) throw new Error('Debt not found');

        if (debt.status === 'settled') throw new Error('Cannot write off settled debt');

        debt.status = 'written-off';
        debt.meta = debt.meta || {};
        debt.meta.set('writeOffReason', reason);
        debt.meta.set('writeOffBy', userId);
        debt.meta.set('writeOffDate', new Date());

        await debt.save();
        return debt;
    }
}

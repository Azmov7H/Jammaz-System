import Debt from '@/models/Debt';
import dbConnect from '@/lib/db';
import { differenceInDays } from 'date-fns';

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

    /**
     * Analyze Aging and get Overview
     */
    static async getDebtOverview() {
        await dbConnect();
        const now = new Date();

        const [receivables, payables] = await Promise.all([
            this.getAgingData('Customer'),
            this.getAgingData('Supplier')
        ]);

        return {
            receivables,
            payables,
            totalNet: receivables.total - payables.total,
            riskScore: this.calculateRisk(receivables)
        };
    }

    static async getAgingData(type) {
        const debts = await Debt.find({
            debtorType: type,
            status: { $in: ['active', 'overdue'] }
        }).lean();

        const now = new Date();
        const result = {
            total: 0,
            overdue: 0,
            tiers: {
                current: 0,
                tier1: 0, // 1-30 days
                tier2: 0, // 31-60 days
                tier3: 0  // 60+ days
            }
        };

        debts.forEach(debt => {
            result.total += debt.remainingAmount;

            const daysOverdue = differenceInDays(now, debt.dueDate);
            if (daysOverdue > 0) {
                result.overdue += debt.remainingAmount;
                if (daysOverdue > 60) result.tiers.tier3 += debt.remainingAmount;
                else if (daysOverdue > 30) result.tiers.tier2 += debt.remainingAmount;
                else result.tiers.tier1 += debt.remainingAmount;
            } else {
                result.tiers.current += debt.remainingAmount;
            }
        });

        return result;
    }

    static calculateRisk(receivables) {
        const tier3Ratio = receivables.total > 0 ? (receivables.tiers.tier3 / receivables.total) : 0;
        if (tier3Ratio > 0.4) return 'CRITICAL';
        if (tier3Ratio > 0.2) return 'WARNING';
        return 'HEALTHY';
    }

    /**
     * Create Installment Plan for a specific Debt
     */
    static async createInstallmentPlan({
        debtId,
        installmentsCount,
        interval = 'monthly',
        startDate,
        userId
    }) {
        await dbConnect();
        const { default: PaymentSchedule } = await import('@/models/PaymentSchedule');

        // Defensive check for ID
        if (!debtId) throw new Error('Debt ID is required for scheduling');

        const debt = await Debt.findById(debtId);
        if (!debt) {
            console.error(`Debt lookup failed for ID: ${debtId}`);
            throw new Error('الديون المطلوبة غير موجودة في النظام (Debt not found)');
        }

        const amountPerInstallment = Math.round((debt.remainingAmount / installmentsCount) * 100) / 100;
        const schedules = [];

        for (let i = 0; i < installmentsCount; i++) {
            const dueDate = new Date(startDate);
            if (interval === 'monthly') dueDate.setMonth(dueDate.getMonth() + i);
            else if (interval === 'weekly') dueDate.setDate(dueDate.getDate() + (i * 7));
            else if (interval === 'daily') dueDate.setDate(dueDate.getDate() + i);

            // Last installment adjustment for rounding
            const actualAmount = (i === installmentsCount - 1)
                ? (debt.remainingAmount - (amountPerInstallment * (installmentsCount - 1)))
                : amountPerInstallment;

            schedules.push({
                entityType: debt.debtorType,
                entityId: debt.debtorId,
                debtId: debt._id,
                amount: actualAmount,
                dueDate,
                status: 'PENDING',
                createdBy: userId,
                notes: `قسط رقم ${i + 1} من أصل ${installmentsCount} - مديونية #${debt.referenceId?.toString().slice(-6).toUpperCase()}`
            });
        }

        // Delete existing scheduled payments for this debt to avoid overlaps if re-scheduling
        const deleteResult = await PaymentSchedule.deleteMany({ debtId, status: 'PENDING' });
        console.log(`[DebtService] Deleted ${deleteResult.deletedCount} existing pending schedules for debt ${debtId}`);

        const createdSchedules = await PaymentSchedule.insertMany(schedules);
        console.log(`[DebtService] Created ${createdSchedules.length} new schedules for debt ${debtId}`);

        // Update Debt Meta
        debt.meta = debt.meta || {};
        debt.meta.set('isScheduled', true);
        debt.meta.set('installmentsCount', installmentsCount);
        debt.meta.set('lastScheduledUpdate', new Date());

        await debt.save();
        console.log(`[DebtService] Updated debt ${debtId} meta to 'isScheduled: true'`);

        return createdSchedules;
    }

    /**
     * Get Installments for a Debt
     */
    static async getInstallments(debtId) {
        await dbConnect();
        const { default: PaymentSchedule } = await import('@/models/PaymentSchedule');
        return await PaymentSchedule.find({ debtId }).sort({ dueDate: 1 }).lean();
    }
}

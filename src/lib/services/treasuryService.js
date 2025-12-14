import TreasuryTransaction from '@/models/TreasuryTransaction';
import CashboxDaily from '@/models/CashboxDaily';
import Invoice from '@/models/Invoice';
import PurchaseOrder from '@/models/PurchaseOrder';

/**
 * Treasury/Cashbox Management Service
 * Handles all financial transactions and daily cashbox operations
 */
export const TreasuryService = {
    /**
     * Record income from a sale (invoice)
     */
    async recordSaleIncome(invoice, userId) {
        // Create treasury transaction
        const transaction = await TreasuryTransaction.create({
            type: 'INCOME',
            amount: invoice.total,
            description: `مبيعات - فاتورة #${invoice.number}`,
            referenceType: 'Invoice',
            referenceId: invoice._id,
            date: invoice.date || new Date(),
            createdBy: userId
        });

        // Update daily cashbox
        await this.updateDailyCashbox(invoice.date || new Date(), {
            salesIncome: invoice.total
        });

        return transaction;
    },

    /**
     * Record expense from a purchase
     */
    async recordPurchaseExpense(purchaseOrder, userId) {
        // Create treasury transaction
        const transaction = await TreasuryTransaction.create({
            type: 'EXPENSE',
            amount: purchaseOrder.totalCost,
            description: `مشتريات - أمر شراء #${purchaseOrder.poNumber}`,
            referenceType: 'PurchaseOrder',
            referenceId: purchaseOrder._id,
            date: purchaseOrder.receivedDate || new Date(),
            createdBy: userId
        });

        // Update daily cashbox
        await this.updateDailyCashbox(purchaseOrder.receivedDate || new Date(), {
            purchaseExpenses: purchaseOrder.totalCost
        });

        return transaction;
    },

    /**
     * Update daily cashbox summary
     */
    async updateDailyCashbox(date, updates) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        // Find or create daily cashbox record
        let cashbox = await CashboxDaily.findOne({ date: startOfDay });

        if (!cashbox) {
            // Get previous day's closing balance
            const yesterday = new Date(startOfDay);
            yesterday.setDate(yesterday.getDate() - 1);
            const previousDay = await CashboxDaily.findOne({ date: yesterday });

            cashbox = await CashboxDaily.create({
                date: startOfDay,
                openingBalance: previousDay?.closingBalance || 0,
                salesIncome: 0,
                purchaseExpenses: 0
            });
        }

        // Update with increments
        if (updates.salesIncome) {
            cashbox.salesIncome += updates.salesIncome;
        }
        if (updates.purchaseExpenses) {
            cashbox.purchaseExpenses += updates.purchaseExpenses;
        }

        await cashbox.save();
        return cashbox;
    },

    /**
     * Add manual income entry
     */
    async addManualIncome(date, amount, reason, userId) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        let cashbox = await CashboxDaily.findOne({ date: startOfDay });

        if (!cashbox) {
            const yesterday = new Date(startOfDay);
            yesterday.setDate(yesterday.getDate() - 1);
            const previousDay = await CashboxDaily.findOne({ date: yesterday });

            cashbox = await CashboxDaily.create({
                date: startOfDay,
                openingBalance: previousDay?.closingBalance || 0
            });
        }

        await cashbox.addIncome(amount, reason, userId);

        // Also record in treasury transactions
        await TreasuryTransaction.create({
            type: 'INCOME',
            amount,
            description: reason,
            referenceType: 'Manual',
            date: new Date(),
            createdBy: userId
        });

        return cashbox;
    },

    /**
     * Add manual expense entry
     */
    async addManualExpense(date, amount, reason, category, userId) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        let cashbox = await CashboxDaily.findOne({ date: startOfDay });

        if (!cashbox) {
            const yesterday = new Date(startOfDay);
            yesterday.setDate(yesterday.getDate() - 1);
            const previousDay = await CashboxDaily.findOne({ date: yesterday });

            cashbox = await CashboxDaily.create({
                date: startOfDay,
                openingBalance: previousDay?.closingBalance || 0
            });
        }

        await cashbox.addExpense(amount, reason, category, userId);

        // Also record in treasury transactions
        await TreasuryTransaction.create({
            type: 'EXPENSE',
            amount,
            description: reason,
            referenceType: 'Manual',
            date: new Date(),
            createdBy: userId
        });

        return cashbox;
    },

    /**
     * Reconcile daily cashbox
     */
    async reconcileCashbox(date, actualClosingBalance, userId, notes = '') {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const cashbox = await CashboxDaily.findOne({ date: startOfDay });

        if (!cashbox) {
            throw new Error('لم يتم العثور على سجل الخزينة لهذا اليوم');
        }

        await cashbox.reconcile(actualClosingBalance, userId, notes);

        return cashbox;
    },

    /**
     * Get current balance
     */
    async getCurrentBalance() {
        // Get latest cashbox record
        const latestCashbox = await CashboxDaily.findOne()
            .sort({ date: -1 })
            .lean();

        if (!latestCashbox) {
            return 0;
        }

        // If reconciled, use closing balance
        if (latestCashbox.isReconciled) {
            return latestCashbox.closingBalance;
        }

        // Otherwise calculate expected balance
        return latestCashbox.openingBalance + latestCashbox.netChange;
    },

    /**
     * Get cashbox for specific date
     */
    async getDailyCashbox(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        return await CashboxDaily.findOne({ date: startOfDay })
            .populate('createdBy', 'name')
            .populate('reconciledBy', 'name')
            .lean();
    },

    /**
     * Get cashbox history for date range
     */
    async getCashboxHistory(startDate, endDate) {
        return await CashboxDaily.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })
            .sort({ date: -1 })
            .lean();
    },

    /**
     * Get all transactions for date range
     */
    async getTransactions(startDate, endDate, type = null) {
        const query = {
            date: {
                $gte: startDate,
                $lte: endDate
            }
        };

        if (type) {
            query.type = type;
        }

        return await TreasuryTransaction.find(query)
            .sort({ date: -1 })
            .populate('createdBy', 'name')
            .lean();
    }
};

import AccountingEntry from '@/models/AccountingEntry';
import dbConnect from '@/lib/db';

/**
 * Accounting Service
 * Handles double-entry bookkeeping and accounting entries
 */

// Chart of Accounts
export const ACCOUNTS = {
    // Assets
    CASH: 'الخزينة / النقدية',
    BANK: 'البنك / الحساب البنكي',
    INVENTORY: 'المخزون',
    RECEIVABLES: 'ذمم العملاء / المدينون',

    // Liabilities
    PAYABLES: 'ذمم الموردين / الدائنون',

    // Revenue
    SALES_REVENUE: 'إيرادات المبيعات',
    OTHER_INCOME: 'إيرادات أخرى',

    // Expenses
    COGS: 'تكلفة البضاعة المباعة',
    RENT_EXPENSE: 'مصروف الإيجار',
    UTILITIES_EXPENSE: 'مصروف الكهرباء والماء',
    SALARIES_EXPENSE: 'مصروف الرواتب',
    SUPPLIES_EXPENSE: 'مصروف اللوازم',
    OTHER_EXPENSE: 'مصروفات أخرى',
    SHORTAGE_EXPENSE: 'خسائر النواقص',
    SURPLUS_INCOME: 'إيرادات الفوائض',
    SALES_RETURNS: 'مردودات المبيعات'
};

export const AccountingService = {
    /**
     * Create accounting entries for a cash sale
     */
    async createSaleEntries(invoice, userId) {
        await dbConnect();

        const entries = [];

        // Entry 1: Debit Cash/Bank, Credit Sales Revenue
        const debitAccount = invoice.paymentType === 'bank' ? ACCOUNTS.BANK : ACCOUNTS.CASH;

        const saleEntry = await AccountingEntry.createEntry({
            type: 'SALE',
            debitAccount: debitAccount,
            creditAccount: ACCOUNTS.SALES_REVENUE,
            amount: invoice.total,
            description: `مبيعات نقدية - فاتورة ${invoice.number}`,
            refType: 'Invoice',
            refId: invoice._id,
            userId,
            date: invoice.date
        });
        entries.push(saleEntry);

        // Entry 2: Debit COGS, Credit Inventory
        if (invoice.totalCost && invoice.totalCost > 0) {
            const cogsEntry = await AccountingEntry.createEntry({
                type: 'COGS',
                debitAccount: ACCOUNTS.COGS,
                creditAccount: ACCOUNTS.INVENTORY,
                amount: invoice.totalCost,
                description: `تكلفة البضاعة المباعة - فاتورة ${invoice.number}`,
                refType: 'Invoice',
                refId: invoice._id,
                userId,
                date: invoice.date
            });
            entries.push(cogsEntry);
        }

        return entries;
    },

    /**
     * Create accounting entries for a credit sale
     */
    async createCreditSaleEntries(invoice, userId) {
        await dbConnect();

        const entries = [];

        // Entry 1: Debit Receivables, Credit Sales Revenue
        const saleEntry = await AccountingEntry.createEntry({
            type: 'SALE',
            debitAccount: ACCOUNTS.RECEIVABLES,
            creditAccount: ACCOUNTS.SALES_REVENUE,
            amount: invoice.total,
            description: `مبيعات آجلة - فاتورة ${invoice.number}`,
            refType: 'Invoice',
            refId: invoice._id,
            userId,
            date: invoice.date
        });
        entries.push(saleEntry);

        // Entry 2: Debit COGS, Credit Inventory
        if (invoice.totalCost && invoice.totalCost > 0) {
            const cogsEntry = await AccountingEntry.createEntry({
                type: 'COGS',
                debitAccount: ACCOUNTS.COGS,
                creditAccount: ACCOUNTS.INVENTORY,
                amount: invoice.totalCost,
                description: `تكلفة البضاعة المباعة - فاتورة ${invoice.number}`,
                refType: 'Invoice',
                refId: invoice._id,
                userId,
                date: invoice.date
            });
            entries.push(cogsEntry);
        }

        return entries;
    },

    /**
     * Create accounting entries for payment collection
     */
    async createPaymentEntries(invoice, paymentAmount, userId, date = new Date()) {
        await dbConnect();

        // Debit Cash, Credit Receivables
        return await AccountingEntry.createEntry({
            type: 'PAYMENT',
            debitAccount: ACCOUNTS.CASH,
            creditAccount: ACCOUNTS.RECEIVABLES,
            amount: paymentAmount,
            description: `تحصيل دفعة - فاتورة ${invoice.number}`,
            refType: 'Invoice',
            refId: invoice._id,
            userId,
            date
        });
    },

    /**
     * Create accounting entries for a purchase
     */
    /**
     * Create accounting entries for a purchase
     */
    async createPurchaseEntries(purchaseOrder, userId, paymentType = 'cash') {
        await dbConnect();

        let creditAccount;
        let description;

        if (paymentType === 'credit') {
            creditAccount = ACCOUNTS.PAYABLES;
            description = `شراء آجل - أمر ${purchaseOrder.poNumber}`;
        } else if (paymentType === 'bank') {
            creditAccount = ACCOUNTS.BANK;
            description = `شراء تحويل بنكي - أمر ${purchaseOrder.poNumber}`;
        } else {
            creditAccount = ACCOUNTS.CASH;
            description = `شراء نقدي - أمر ${purchaseOrder.poNumber}`;
        }

        // Debit Inventory, Credit Cash or Payables
        return await AccountingEntry.createEntry({
            type: 'PURCHASE',
            debitAccount: ACCOUNTS.INVENTORY,
            creditAccount: creditAccount,
            amount: purchaseOrder.totalCost,
            description: description,
            refType: 'PurchaseOrder',
            refId: purchaseOrder._id,
            userId,
            date: purchaseOrder.receivedDate || purchaseOrder.createdAt
        });
    },

    /**
     * Create accounting entries for physical inventory adjustments
     */
    async createInventoryAdjustmentEntries(physicalInventory, userId) {
        await dbConnect();

        const entries = [];

        // If there's a net shortage (loss)
        if (physicalInventory.valueImpact < 0) {
            const entry = await AccountingEntry.createEntry({
                type: 'ADJUSTMENT',
                debitAccount: ACCOUNTS.SHORTAGE_EXPENSE,
                creditAccount: ACCOUNTS.INVENTORY,
                amount: Math.abs(physicalInventory.valueImpact),
                description: `خسائر جرد - ${physicalInventory.location}`,
                refType: 'PhysicalInventory',
                refId: physicalInventory._id,
                userId,
                date: physicalInventory.approvedAt || physicalInventory.date
            });
            entries.push(entry);
        }
        // If there's a net surplus (gain)
        else if (physicalInventory.valueImpact > 0) {
            const entry = await AccountingEntry.createEntry({
                type: 'ADJUSTMENT',
                debitAccount: ACCOUNTS.INVENTORY,
                creditAccount: ACCOUNTS.SURPLUS_INCOME,
                amount: physicalInventory.valueImpact,
                description: `فوائض جرد - ${physicalInventory.location}`,
                refType: 'PhysicalInventory',
                refId: physicalInventory._id,
                userId,
                date: physicalInventory.approvedAt || physicalInventory.date
            });
            entries.push(entry);
        }

        return entries;
    },

    /**
     * Create manual expense entry
     */
    async createExpenseEntry(amount, category, description, userId, date = new Date()) {
        await dbConnect();

        let expenseAccount;
        switch (category) {
            case 'rent':
                expenseAccount = ACCOUNTS.RENT_EXPENSE;
                break;
            case 'utilities':
                expenseAccount = ACCOUNTS.UTILITIES_EXPENSE;
                break;
            case 'salaries':
                expenseAccount = ACCOUNTS.SALARIES_EXPENSE;
                break;
            case 'supplies':
                expenseAccount = ACCOUNTS.SUPPLIES_EXPENSE;
                break;
            default:
                expenseAccount = ACCOUNTS.OTHER_EXPENSE;
        }

        return await AccountingEntry.createEntry({
            type: 'EXPENSE',
            debitAccount: expenseAccount,
            creditAccount: ACCOUNTS.CASH,
            amount,
            description,
            refType: 'Manual',
            userId,
            date,
            isSystemGenerated: false
        });
    },

    /**
     * Create manual income entry
     */
    async createIncomeEntry(amount, description, userId, date = new Date()) {
        await dbConnect();

        return await AccountingEntry.createEntry({
            type: 'INCOME',
            debitAccount: ACCOUNTS.CASH,
            creditAccount: ACCOUNTS.OTHER_INCOME,
            amount,
            description,
            refType: 'Manual',
            userId,
            date,
            isSystemGenerated: false
        });
    },

    /**
     * Get ledger for a specific account
     */
    async getLedger(accountName, startDate = null, endDate = null) {
        await dbConnect();

        const query = {
            $or: [
                { debitAccount: accountName },
                { creditAccount: accountName }
            ]
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const entries = await AccountingEntry.find(query)
            .sort({ date: 1, createdAt: 1 })
            .populate('createdBy', 'name')
            .lean();

        // Calculate running balance
        let balance = 0;
        const ledgerEntries = entries.map(entry => {
            const isDebit = entry.debitAccount === accountName;
            const amount = isDebit ? entry.amount : -entry.amount;
            balance += amount;

            return {
                ...entry,
                isDebit,
                debit: isDebit ? entry.amount : 0,
                credit: !isDebit ? entry.amount : 0,
                balance
            };
        });

        return {
            account: accountName,
            entries: ledgerEntries,
            finalBalance: balance
        };
    },

    /**
     * Get trial balance
     */
    async getTrialBalance(asOfDate = new Date()) {
        await dbConnect();

        const allEntries = await AccountingEntry.find({
            date: { $lte: asOfDate }
        }).lean();

        const balances = {};

        // Calculate balance for each account
        for (const entry of allEntries) {
            // Debit side
            if (!balances[entry.debitAccount]) {
                balances[entry.debitAccount] = { debit: 0, credit: 0 };
            }
            balances[entry.debitAccount].debit += entry.amount;

            // Credit side
            if (!balances[entry.creditAccount]) {
                balances[entry.creditAccount] = { debit: 0, credit: 0 };
            }
            balances[entry.creditAccount].credit += entry.amount;
        }

        const trialBalance = Object.entries(balances).map(([account, { debit, credit }]) => ({
            account,
            debit,
            credit,
            balance: debit - credit
        }));

        const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
        const totalCredit = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);

        return {
            asOfDate,
            accounts: trialBalance,
            totalDebit,
            totalCredit,
            difference: totalDebit - totalCredit,
            isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
        };
    },

    /**
     * Get all entries with filters
     */
    async getEntries({ startDate, endDate, type, account, limit = 100 } = {}) {
        await dbConnect();

        const query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (type) {
            query.type = type;
        }

        if (account) {
            query.$or = [
                { debitAccount: account },
                { creditAccount: account }
            ];
        }

        return await AccountingEntry.find(query)
            .sort({ date: -1, createdAt: -1 })
            .limit(limit)
            .populate('createdBy', 'name')
            .lean();
    },

    /**
     * Create accounting entries for Sales Return
     */
    async createReturnEntries(salesReturn, totalCostOfReturnedGoods, userId) {
        await dbConnect();

        const entries = [];

        // 1. REFUND Entry: Debit Sales Returns, Credit Cash/Receivables
        // Reducing Revenue (Contra-Revenue) and Reducing Asset (Cash/Debt)
        const creditAccount = salesReturn.type === 'cash' ? ACCOUNTS.CASH : ACCOUNTS.RECEIVABLES;

        const returnEntry = await AccountingEntry.createEntry({
            type: 'RETURN',
            debitAccount: ACCOUNTS.SALES_RETURNS,
            creditAccount: creditAccount,
            amount: salesReturn.totalRefund,
            description: `مردودات مبيعات - إشعار ${salesReturn.returnNumber}`,
            refType: 'SalesReturn',
            refId: salesReturn._id,
            userId,
            date: salesReturn.date
        });
        entries.push(returnEntry);

        // 2. STOCK REVERSAL Entry: Debit Inventory, Credit COGS
        // We got the goods back, so we reverse the cost
        if (totalCostOfReturnedGoods > 0) {
            const inventoryEntry = await AccountingEntry.createEntry({
                type: 'RETURN_COGS',
                debitAccount: ACCOUNTS.INVENTORY,
                creditAccount: ACCOUNTS.COGS,
                amount: totalCostOfReturnedGoods,
                description: `استرجاع تكلفة مخزون - إشعار ${salesReturn.returnNumber}`,
                refType: 'SalesReturn',
                refId: salesReturn._id,
                userId,
                date: salesReturn.date
            });
            entries.push(inventoryEntry);
        }

        return entries;
    }
};

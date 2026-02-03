/**
 * Accounting Service (Client-Side)
 * Connects to Backend API
 */
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
    SALES_RETURNS: 'مردودات المبيعات',
    WALLET: 'محفظة كاش'
};

export const AccountingService = {
    async getLedger(account, startDate, endDate) {
        const params = new URLSearchParams({ account });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const res = await fetch(`/api/accounting/ledger?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch ledger');
        return res.json();
    },

    async getTrialBalance(date) {
        const params = new URLSearchParams();
        if (date) params.append('date', date);

        const res = await fetch(`/api/accounting/trial-balance?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch trial balance');
        return res.json();
    },

    async getEntries(params = {}) {
        const query = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key]) query.append(key, params[key]);
        });

        const res = await fetch(`/api/accounting/entries?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch entries');
        return res.json();
    },

    async createExpenseEntry(amount, category, description, date) {
        const res = await fetch('/api/accounting/entries/expense', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, category, description, date })
        });
        if (!res.ok) throw new Error('Failed to create expense entry');
        return res.json();
    },

    async createIncomeEntry(amount, description, date) {
        const res = await fetch('/api/accounting/entries/income', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, description, date })
        });
        if (!res.ok) throw new Error('Failed to create income entry');
        return res.json();
    }
};

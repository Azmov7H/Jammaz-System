/**
 * Debt Service (Client-Side)
 * Connects to Backend API
 */
export const DebtService = {
    // Get Debtors Overview
    async getDebtOverview() {
        const res = await fetch('/api/financial/debts/overview');
        if (!res.ok) throw new Error('Failed to fetch debt overview');
        return res.json();
    },

    // Get Debtors List with Balances
    async getDebtorsWithBalance(type, params = {}) {
        const query = new URLSearchParams({ type, ...params }).toString();
        const res = await fetch(`/api/financial/debts/debtors?${query}`);
        if (!res.ok) throw new Error('Failed to fetch debtors');
        return res.json();
    },

    // Get Specific Debts
    async getDebts(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`/api/financial/debts?${query}`);
        if (!res.ok) throw new Error('Failed to fetch debts');
        return res.json();
    },

    // Create Debt (Manual)
    async createDebt(data) {
        // Backend logic might be inside a "manual debt" endpoint or generally under debts
        // Let's assume POST /api/financial/debts/manual for now, or use the financeRoutes generic "expense/income" if strict
        // But debtService usually implies creating a formal debt record.
        const res = await fetch('/api/financial/debts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create debt');
        return res.json();
    },

    async updateDebt(id, data) {
        const res = await fetch(`/api/financial/debts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update debt');
        return res.json();
    },

    async deleteDebt(id) {
        const res = await fetch(`/api/financial/debts/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete debt');
        return res.json();
    },

    // Installment Plans
    async createInstallmentPlan(data) {
        const res = await fetch('/api/financial/installments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create installment plan');
        return res.json();
    },

    async getInstallments(debtId) {
        const res = await fetch(`/api/financial/installments/${debtId}`);
        if (!res.ok) throw new Error('Failed to fetch installments');
        return res.json();
    }
};

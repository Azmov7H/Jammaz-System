/**
 * Expense Service (Client-Side)
 * Connects to Backend API
 */
export const ExpenseService = {
    async recordExpense(data) {
        const res = await fetch('/api/financial/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to record expense');
        return res.json();
    }
};

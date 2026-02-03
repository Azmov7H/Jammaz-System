/**
 * Payment Service (Client-Side)
 * Connects to Backend API
 */
export const PaymentService = {
    async recordCustomerPayment(invoice, amount, method, note) {
        const res = await fetch('/api/financial/payments/customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoice, amount, method, note })
        });
        if (!res.ok) throw new Error('Payment failed');
        return res.json();
    },

    async recordUnifiedPayment(customerId, amount, method, note) {
        const res = await fetch('/api/financial/payments/unified', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId, amount, method, note })
        });
        if (!res.ok) throw new Error('Unified payment failed');
        return res.json();
    },

    async recordSupplierPayment(po, amount, method, note) {
        const res = await fetch('/api/financial/payments/supplier', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ po, amount, method, note })
        });
        if (!res.ok) throw new Error('Supplier payment failed');
        return res.json();
    },

    async recordDebtPayment(debtId, amount, method, note) {
        const res = await fetch('/api/financial/payments/debt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ debt: { _id: debtId }, amount, method, note })
        });
        if (!res.ok) throw new Error('Debt payment failed');
        return res.json();
    }
};

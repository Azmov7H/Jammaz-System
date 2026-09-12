/**
 * Finance Service — owns the /api/financial/* and /api/payments endpoint contracts.
 * UI/hooks must not hardcode these URLs (FE-DATA-005, D2/D10).
 */
import { api } from '@/lib/api-utils';

/**
 * @typedef {Object} TreasuryTransaction
 * @property {string} _id
 * @property {'INCOME'|'EXPENSE'} type
 * @property {number} amount
 * @property {string} [description]
 */

/**
 * @typedef {Object} Debt
 * @property {string} _id
 * @property {string} debtorId
 * @property {'Customer'|'Supplier'} debtorType
 * @property {number} amount
 * @property {number} [paidAmount]
 * @property {'active'|'settled'} [status]
 */

/** @param {object} params @param {{signal?: AbortSignal}} [options] */
export const getTreasury = (params = {}, options) => api.get('/api/financial/treasury', params, options);

/**
 * Full ledger of treasury transactions for the requested window.
 * Returns a bare `TreasuryTransaction[]` (envelope already unwrapped by
 * `api.get`; tolerate `{ transactions: [...] }` / `{ data: [...] }` shapes
 * at the call site for forward-compatibility).
 * Use this for the transaction-history table; `getTreasury` only returns
 * the latest 20 most-recent rows in the same window.
 * @param {object} params @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<TreasuryTransaction[]>}
 */
export const getTreasuryTransactions = (params = {}, options) =>
    api.get('/api/treasury/transactions', params, options);

/**
 * Full-period cash-flow buckets (DB-aggregated, never page-capped).
 * Returns `{ granularity: 'day'|'month', buckets: [{key,income,expense}] }`.
 * Use this for the treasury chart; the ledger above only carries the
 * latest page of rows and must never feed period aggregates.
 * @param {object} params @param {{signal?: AbortSignal}} [options]
 */
export const getCashFlow = (params = {}, options) =>
    api.get('/api/treasury/cashflow', params, options);

/**
 * FIN-RPT-01 — per-number movement aggregates for wallet / instapay.
 * Server-computed `{ method, period, numbers: [{number,received,withdrawn,
 * count,net}], totals }`. The UI must display these as-is and never
 * re-sum money client-side. Detail rows come from getTreasuryTransactions
 * with `method` + `sourceNumber`.
 * @param {object} params @param {{signal?: AbortSignal}} [options]
 */
export const getNumberReport = (params = {}, options) =>
    api.get('/api/treasury/number-report', params, options);

/** @param {object} data @returns {Promise<*>} */
export const addTreasuryTransaction = (data) => api.post('/api/financial/transaction', data);

/** @param {string} id @returns {Promise<*>} */
export const deleteTreasuryTransaction = (id) => api.delete(`/api/financial/transaction/${id}`);

/**
 * FIN-TAHWEESH-04/05 — set-aside account client.
 * getTahweeshBalance returns `{ balance }` (stored doc, ledger-rebuilt
 * when missing). Deposit/withdraw accept `{ amount, note, transferId,
 * source?, sourceNumber? }` — the caller generates transferId (uuid) so
 * retries are idempotent.
 */
export const getTahweeshBalance = (options) => api.get('/api/tahweesh/balance', {}, options);
/** @param {object} data @returns {Promise<*>} */
export const depositTahweesh = (data) => api.post('/api/tahweesh/deposit', data);
/** @param {object} data @returns {Promise<*>} */
export const withdrawTahweesh = (data) => api.post('/api/tahweesh/withdraw', data);

/** @param {object} params @param {{signal?: AbortSignal}} [options] @returns {Promise<{debts?: Debt[]}>} */
export const getDebts = (params = {}, options) => api.get('/api/financial/debts', params, options);

/** @param {object} params @param {{signal?: AbortSignal}} [options] */
export const getDebtors = (params = {}, options) => api.get('/api/financial/debts/debtors', params, options);

/** @param {{signal?: AbortSignal}} [options] */
export const getDebtOverview = (options) => api.get('/api/financial/debts/overview', undefined, options);

/**
 * Generic counterparty payment dispatcher (manager+).
 * Body must include one of `customerId` / `supplierId` / `debtId`
 * plus `amount`, `method`, optional `note` / `sourceNumber`.
 * @param {object} data @returns {Promise<*>}
 */
export const addPayment = (data) => api.post('/api/financial/payments', data);

/**
 * Supplier payment against received, unpaid purchase orders.
 * @param {{ supplierId: string, amount: number, method: string, note?: string, sourceNumber?: string }} data
 * @returns {Promise<*>}
 */
export const addSupplierPayment = (data) => api.post('/api/financial/payments', data);

/**
 * Per-invoice customer collection (any authenticated role per
 * POST /payments/customer — no manager gate, unlike the dispatcher).
 * @param {{ invoice: string, amount: number, method: string, note?: string, sourceNumber?: string }} data
 * @returns {Promise<{ invoice: *, transaction: TreasuryTransaction }>}
 */
export const recordInvoicePayment = (data) => api.post('/api/financial/payments/customer', data);

/** @param {string} debtId @param {{signal?: AbortSignal}} [options] */
export const getDebtPayments = (debtId, options) => api.get('/api/financial/payments', { debtId }, options);

/** @param {string} debtId @param {{signal?: AbortSignal}} [options] */
export const getDebtInstallments = (debtId, options) => api.get(`/api/financial/debts/${debtId}/installments`, undefined, options);

/** @param {string} debtId @param {object} data @returns {Promise<*>} */
export const createInstallments = (debtId, data) => api.post(`/api/financial/debts/${debtId}/installments`, data);

/**
 * Receivables list (open invoices) — local DB only, no integration.
 * Uses the canonical `GET /api/invoices` endpoint (InvoiceService.getAll)
 * and merges `pending` + `partial` payment statuses, which the endpoint
 * only filters one at a time. Returns `{ invoices, count, totalReceivables }`
 * to match the page contract.
 * @param {{ customerId?: string, page?: number, limit?: number }} [params]
 * @param {{signal?: AbortSignal}} [options]
 */
export const getReceivables = async (params = {}, options) => {
    const { customerId, limit = 100 } = params || {};
    const base = { limit, ...(customerId ? { customerId } : {}) };
    const [pending, partial] = await Promise.all([
        api.get('/api/invoices', { ...base, status: 'pending' }, options),
        api.get('/api/invoices', { ...base, status: 'partial' }, options),
    ]);
    const invoices = [...(pending?.invoices || []), ...(partial?.invoices || [])]
        .sort((a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date));
    const totalReceivables = invoices.reduce(
        (sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount || 0)), 0
    );
    return { invoices, count: invoices.length, totalReceivables };
};

/** @param {object} data @returns {Promise<*>} */
export const syncDebts = (data) => api.post('/api/financial/debts/sync', data);

/** @param {string} id @param {object} data @returns {Promise<*>} */
export const updateDebt = (id, data) => api.patch(`/api/financial/debts/${id}`, data);

/** @param {string} customerId @param {object} data @returns {Promise<*>} unified payment distributed across invoices */
export const payCustomerTotal = (customerId, data) => api.post(`/api/customers/${customerId}/pay`, data);

/** @param {string} partnerId @param {object} params @param {{signal?: AbortSignal}} [options] */
export const getPartnerTransactions = (partnerId, params = {}, options) => api.get(`/api/financial/partner/${partnerId}/transactions`, params, options);

/** @param {string} receiptId @param {{signal?: AbortSignal}} [options] */
export const getReceipt = (receiptId, options) => api.get(`/api/financial/receipts/${receiptId}`, undefined, options);

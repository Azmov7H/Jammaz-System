/**
 * FIN-RPT-01 — shared vocabulary for the wallet/instapay number reports.
 * Pure helpers (no React) so they are unit-testable under jest.
 * Money itself is NEVER computed here — aggregates come from the server.
 */

export const NUMBER_REPORT_METHODS = ['wallet', 'instapay'];

export const METHOD_AR = {
    wallet: 'محفظة كاش',
    instapay: 'انستا باي',
};

/** Sentinel key for ledger rows that carry no number (documented gaps). */
export const UNASSIGNED_KEY = '__unassigned';
export const UNASSIGNED_LABEL = 'بدون رقم (حركات تاريخية / تسويات)';

export function formatNumberKey(key) {
    return key === UNASSIGNED_KEY ? UNASSIGNED_LABEL : key;
}

/**
 * UI transaction-type filter → server query params. Only filters the
 * backend can reliably support (type / referenceType enums) are offered.
 */
export const NUMBER_TYPE_FILTERS = [
    { id: 'ALL', label: 'الكل', params: {} },
    { id: 'RECEIVED', label: 'وارد', params: { direction: 'INCOME' } },
    { id: 'WITHDRAWN', label: 'صادر', params: { direction: 'EXPENSE' } },
    { id: 'TRANSFERS', label: 'تحويلات', params: { referenceType: 'TahweeshTransfer' } },
    { id: 'COLLECTIONS', label: 'تحصيلات', params: { referenceType: 'UnifiedCollection' } },
    { id: 'DEBTS', label: 'مديونيات', params: { referenceType: 'Debt' } },
    { id: 'MANUAL', label: 'يدوي', params: { referenceType: 'Manual' } },
];

export function resolveTypeFilter(id) {
    return NUMBER_TYPE_FILTERS.find((f) => f.id === id)?.params ?? {};
}

export function isNumberReportMethod(method) {
    return NUMBER_REPORT_METHODS.includes(method);
}

/**
 * FIN-RPT-01 — shared number-report vocabulary (pure helpers).
 */
import {
    formatNumberKey,
    isNumberReportMethod,
    resolveTypeFilter,
    UNASSIGNED_KEY,
    UNASSIGNED_LABEL,
} from './numberReport';

describe('numberReport helpers', () => {
    it('accepts only wallet and instapay', () => {
        expect(isNumberReportMethod('wallet')).toBe(true);
        expect(isNumberReportMethod('instapay')).toBe(true);
        expect(isNumberReportMethod('cash')).toBe(false);
        expect(isNumberReportMethod('bank')).toBe(false);
        expect(isNumberReportMethod('tahweesh')).toBe(false);
    });

    it('labels the unassigned bucket instead of leaking the sentinel', () => {
        expect(formatNumberKey(UNASSIGNED_KEY)).toBe(UNASSIGNED_LABEL);
        expect(formatNumberKey('01012345678')).toBe('01012345678');
    });

    it('maps UI filters to server-supported params only', () => {
        expect(resolveTypeFilter('ALL')).toEqual({});
        expect(resolveTypeFilter('RECEIVED')).toEqual({ direction: 'INCOME' });
        expect(resolveTypeFilter('WITHDRAWN')).toEqual({ direction: 'EXPENSE' });
        expect(resolveTypeFilter('TRANSFERS')).toEqual({ referenceType: 'TahweeshTransfer' });
        expect(resolveTypeFilter('COLLECTIONS')).toEqual({ referenceType: 'UnifiedCollection' });
        expect(resolveTypeFilter('BOGUS')).toEqual({});
    });
});

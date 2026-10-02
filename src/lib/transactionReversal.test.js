/**
 * FIN-REV-01 (T-REV) — decision-helper unit tests.
 */
const { getReversalAction, getReversalStateLabel } = require('./transactionReversal');

describe('getReversalAction', () => {
    it('rejects null rows', () => {
        expect(getReversalAction(null, 'owner')?.canReverse).toBe(false);
    });

    it('is owner-only', () => {
        const tx = { referenceType: 'Manual', isReversed: false };
        expect(getReversalAction(tx, 'manager').canReverse).toBe(false);
        expect(getReversalAction(tx, 'owner').canReverse).toBe(true);
    });

    it('is never reversible for Reversal rows and already-reversed rows', () => {
        expect(getReversalAction({ referenceType: 'Reversal', isReversed: true }, 'owner').kind).toBe('done');
        expect(getReversalAction({ referenceType: 'Manual', isReversed: true }, 'owner').kind).toBe('done');
    });

    it('allows Manual / Debt / UnifiedCollection compensating reversals', () => {
        for (const type of ['Manual', 'Debt', 'UnifiedCollection']) {
            expect(getReversalAction({ referenceType: type }, 'owner').canReverse).toBe(true);
        }
    });

    it('allows PO payment legs (meta present) but refuses receive legs', () => {
        const paymentLeg = { referenceType: 'PurchaseOrder', meta: { customerBalanceAfter: 5 } };
        expect(getReversalAction(paymentLeg, 'owner').canReverse).toBe(true);
        const receiveLeg = { referenceType: 'PurchaseOrder', meta: {} };
        const a = getReversalAction(receiveLeg, 'owner');
        expect(a.canReverse).toBe(false);
        expect(a.kind).toBe('purchase-void');
    });

    it('points document-backed rows at the source document', () => {
        const inv = getReversalAction({ referenceType: 'Invoice' }, 'owner');
        expect(inv.canReverse).toBe(false);
        expect(inv.kind).toBe('document');
        expect(inv.guidance).toMatch(/الفاتورة/);
        const ret = getReversalAction({ referenceType: 'SalesReturn' }, 'owner');
        expect(ret.kind).toBe('document');
    });

    it('points TahweeshTransfer legs at the withdraw flow', () => {
        const a = getReversalAction({ referenceType: 'TahweeshTransfer' }, 'owner');
        expect(a.canReverse).toBe(false);
        expect(a.kind).toBe('tahweesh');
    });

    it('falls back gracefully for unknown reference type', () => {
        expect(getReversalAction({ referenceType: 'SomethingElse' }, 'owner').canReverse).toBe(false);
    });
});

describe('getReversalStateLabel', () => {
    it('labels reversed and reversal rows', () => {
        expect(getReversalStateLabel({ referenceType: 'Reversal' })).toBe('إلغاء / تراجع');
        expect(getReversalStateLabel({ isReversed: true })).toBe('مُعكّسة');
        expect(getReversalStateLabel({ referenceType: 'Manual' })).toBe('');
        expect(getReversalStateLabel(null)).toBe('');
    });
});
/**
 * FIN-REV-01 (T-REV) — shared UI decision helper for the compensating
 * "reverse transaction" action.
 *
 * The backend keeps history: it marks the original row `isReversed`, books a
 * flipped-type `Reversal` counter-entry (same partnerId, so it shows up in the
 * customer/supplier statement) and restores the linked balances
 * (debt / purchase-order / customer balance / cashbox).
 *
 * Eligibility mirrors the backend contract so the button only appears where
 * the server will accept it:
 *   - owner-only (same ACL as the old hard-delete);
 *   - `Manual` rows (income/expense) and money legs => compensating reversal;
 *   - `PurchaseOrder` rows => only PAYMENT legs are reversible (they always
 *     carry `meta`); the receive/purchase leg is refused server-side;
 *   - `Invoice` / `SalesReturn` rows share a P&L GL pair and are refused —
 *     the guidance points at the source document;
 *   - `TahweeshTransfer` legs are refused — use the withdraw flow;
 *   - `Reversal` rows and already-reversed rows are never reversible.
 */

const DOCUMENT_GUIDANCE = {
    Invoice: 'ألغِ الفاتورة المصدرية من صفحتها ليُعكس الأثر المالي',
    SalesReturn: 'استخدم مرتجع المبيعات / إلغاء المستند المصدر',
};

function hasMeta(tx) {
    return Boolean(tx.meta && typeof tx.meta === 'object' && Object.keys(tx.meta).length > 0);
}

/**
 * @param {object|undefined|null} tx
 * @param {string|undefined} role
 * @returns {{ canReverse: boolean, kind: string, guidance?: string }}
 */
export function getReversalAction(tx, role) {
    if (!tx || tx.referenceType === 'Reversal' || tx.isReversed) {
        return { canReverse: false, kind: 'done' };
    }
    if (role !== 'owner') {
        return { canReverse: false, kind: 'acl' };
    }

    switch (tx.referenceType) {
        case 'Manual':
        case 'Debt':
        case 'UnifiedCollection':
            return { canReverse: true, kind: 'compensating' };
        case 'PurchaseOrder':
            // Payment legs carry meta; the receive leg does not.
            if (hasMeta(tx)) return { canReverse: true, kind: 'compensating' };
            return { canReverse: false, kind: 'purchase-void', guidance: 'هذه الحركة تمثل استلام أمر الشراء وليست دفعة للمورد' };
        case 'Invoice':
        case 'SalesReturn':
            return { canReverse: false, kind: 'document', guidance: DOCUMENT_GUIDANCE[tx.referenceType] };
        case 'TahweeshTransfer':
            return { canReverse: false, kind: 'tahweesh', guidance: 'استخدم سحبًا من التحويش بدلًا من عكس الحركة' };
        default:
            return { canReverse: false, kind: 'unknown' };
    }
}

/** Short Arabic label describing the reversal state of a row. */
export function getReversalStateLabel(tx) {
    if (!tx) return '';
    if (tx.referenceType === 'Reversal') return 'إلغاء / تراجع';
    if (tx.isReversed) return 'مُعكّسة';
    return '';
}
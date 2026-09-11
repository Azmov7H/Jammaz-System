# Over-Deduction Remediation Plan (FIN-OVERDEDUCT)

## 1. Root cause

Balances (`Customer.balance`, `Supplier.balance`) are **stored running totals**:
`createDebt` `$inc +amount`, `updateBalance` `$inc −amountPaid` (guarded),
everything else ad hoc. Three service paths decrement **without any
available-balance check**:

1. `PaymentService.recordTotalCustomerPayment` (`services/financial/paymentService.js:157-160`):
   any `remainingAmount` left after the debt loop is unconditionally
   `$inc: {balance: −remaining}`. Collecting more than owed drives
   `Customer.balance` negative. The `balance<=0` guard at :114 only blocks
   the zero-balance case, never the over-amount case.
2. `recordCustomerPayment` fallback (:71) and `recordSupplierPayment`
   fallback (:242): when no `Debt` row exists, `$inc −amount` is unbounded.
   The debt path "blocks" overpay only by accident (`updateBalance` `$gte`
   miss → misleading `NotFoundError 'Debt not found'`).
3. `SaleService` credit path (`saleService.js:48-59`): `usedCreditBalance`
   decrement is a guarded no-op whose null result is ignored — the invoice
   still books `paidAmount = total − used`, so credit is spent without being
   deducted (double-spend + cash short).

Secondary: `DebtService.updateDebt` accepts `remaining > original`
(negative collected → negative progress bars); `deleteDebt` blindly
`$inc −remaining`. Frontend enforces no cap anywhere (one `max=` attr that
is never compared in JS). Live DB is clean (no negatives) — no migration.

## 2. Fix (backend is the gate; frontend is UX only)

- `recordTotalCustomerPayment`: compute
  `collectible = Σ active remaining + max(0, balance − Σ)`; reject
  `amount − collectible > 0.01` with 400 + available figure (RefundService
  message pattern). Guard the residual `$inc` with `balance: {$gte: …}`
  (closes the no-debt race); race loss → same 400.
- `recordCustomerPayment` / `recordSupplierPayment`: reload doc in-txn,
  reject `amount > remaining` with 400 + remaining figure (covers debt and
  fallback paths uniformly; also replaces the misleading Debt-not-found).
- `recordManualDebtPayment`: reload debt in-txn, reject overpay with 400 +
  remaining figure (guarded `updateBalance` stays as the atomic backstop).
- `InvoiceService.create`: reject `usedCreditBalance > min(total,
  creditBalance)` (non-credit invoices) before creating anything.
- `updateDebt`: validate finite numbers, `0 ≤ remaining ≤ original`;
  `deleteDebt`: guarded decrement (`balance $gte remaining`), else 400
  inconsistency error.
- All inside the existing `withTransaction`/`withRetry`; no new source of
  truth; no schema changes; no treasury EXPENSE sufficiency gate (see §4).

## 3. Frontend (no silent modification, server message via existing toasts)

- `PaymentDialog` (invoice/debt/total branches), `SupplierDebtManager`,
  receivables page: `max=` attr + pre-submit toast error when
  `amount > available` (early UX only).
- Expenses page: display treasury balance hint (fetch via `useTreasury`).
- Display-only guards: debt progress clamp 0–100 + NaN guard;
  installment per-payment `max(1, count)` (Infinity fix).

## 4. Deliberately NOT changed (with reason)

- Treasury EXPENSE sufficiency: `TreasuryBalance.min = MIN_SAFE_INTEGER`
  is an explicit design allowance; adjustment txns (`method:'adjustment'`)
  move no cash and would false-positive. Policy decision for owners.
- `Customer.creditBalance` increase on returns (refund creates credit by design).
- `reconcile` negative actuals (physical count truth).
- No `min:0` schema validators (skipped on `$inc` updates → false confidence).

## 5. Tests (`be-Jammaz/tests/over-deduction.test.js`, HTTP-level)

Valid: partial collect; exact-amount unified collect; per-invoice pay;
supplier PO pay; manual debt pay; exact credit use. Invalid: unified overpay,
invoice overpay, supplier overpay, debt overpay, credit overuse, 0/negative/
missing/decimal amounts, double-collect race (balance never negative).
Regression: full BE suite + FE financial/documents/lib/hooks suites.

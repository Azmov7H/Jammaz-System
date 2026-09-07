# Printing Test Plan

## Automated (run in CI)

- `TreasuryPrintView.test.jsx`: title/period/summary render; one table row per
  record with the description in a single cell; `hidden print:block` + `dir=rtl`;
  empty state.
- `documents.test.jsx`: header/footer/print-styles smoke tests.
- `dates.test.js`: local-vs-UTC day strings (also under `TZ=Africa/Cairo`),
  same-day comparison.
- BE `tests/pagination.test.js`: EOD expansion of date-only ends, datetime
  passthrough, defaults/clamps intact.
- BE `document/renderers/pdf.test.js`: dispatcher routing incl.
  SUPPLIER_ACCOUNT_STATEMENT, 501s stay `AppError`, verbatim-ID locks.

## Manual (per release touching documents)

Invoice: short + long (multi-page: header repeats, totals intact), Arabic-only,
mixed Arabic/English + IDs (`INV-…`, `REC-…`), discounts, multi-item, large
totals. Payment: customer + supplier, cash/bank/wallet/instapay. Statement:
few + many transactions (multi-page), custom ranges. Treasury: TODAY/MONTH/
CUSTOM + type filter — printed rows must equal the filtered full set, totals
must match the printed rows. Save via browser "Save as PDF" and verify on a
phone (WhatsApp share check).

## Dates

Yesterday/today/tomorrow boundaries (esp. 00:00–03:00 Cairo), month edges,
custom ranges; ledger totals stable across midnight with the tab open
(rollover invalidates, no manual refresh); history unchanged (spot-check an
old transaction's stored date before/after).

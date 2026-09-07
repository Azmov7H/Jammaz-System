# Printing & Financial Date — Technical Audit

Date: 2026-09-07. Scope: `Jammaz-System` (Next.js frontend) + `be-Jammaz` (Express backend).
Method: full code trace, no behavior changed for this document.
Protected: accounting, inventory, sales/purchases, customers/suppliers, payments,
balances, calculations, DB relationships and schemas — none of these are modified
by the remediation unless explicitly listed as required.

---

## 1. Current printing architecture

### 1.1 How printing currently works (per surface)

| Surface | Buttons | What actually prints | Mechanism |
|---|---|---|---|
| Invoice detail `invoices/[id]` | Server Preview + local Quick Print (`window.print()`); `DocumentActions formats=[]` | Dedicated `InvoicePrintView` via CSS visibility technique — the ONE correct local isolation | `components/invoices/InvoicePrintView.jsx:47,254-299`, `app/(protected)/invoices/[id]/page.jsx:84-86` |
| Receipt detail `financial/receipts/[id]` | Server pdf+print + local Quick Print | **Whole page + app shell** — no shell-hiding print CSS | `page.jsx:119-165` |
| PO detail `purchase-orders/[id]` | Server pdf+print + local print | **Whole page + shell** — only `print:shadow-none` tweaks | `page.jsx:50-82` |
| Treasury `financial/page` | Export + new `طباعة التقرير` → `TreasuryPrintView` | **Currently blank** — `print:hidden` ancestor (`page.jsx:285`) hides the `hidden print:block` print view; a child cannot escape a `display:none` parent | `financial/page.jsx:285,498-506`, `TreasuryPrintView.jsx:38` |
| Income statement `reports/financial` | Print only | **Whole page + shell** | `page.jsx:76-105` |
| Sales report `reports/sales` | Export only | No print path | `page.jsx:95` |
| Customer statement/transaction tabs | Server print/pdf via `DocumentActions` | Server HTML in new tab (no shell — clean) but **never auto-prints** | `CustomerStatementTab.jsx`, `CustomerTransactionTab.jsx` |
| Supplier statement tab | Same, but `documentType=CUSTOMER_ACCOUNT_STATEMENT` with a supplier id — **wrong-type bug**, fetches the wrong document | `SupplierStatementTab.jsx:100-105` | |
| Partner ledger dialog | `طباعة السجل` → body-class + `window.print()` | Minimal `#print-area` table (works, fragile sync class removal) | `PartnerTransactionDialog.jsx:37-41`, `globals.css:162-178` |
| Server "Print" (`DocumentActions` print) | Opens preview URL with `?autoprint=1` | Backend **ignores** `autoprint` (`renderPrintHtml autoPrint:false` hardcoded) — opens a second preview tab, no dialog | `be-Jammaz/document/index.js:133-134`, FE `documentService.js:187` |

### 1.2 Backend document engine (real vs 501)

`GET|POST /api/documents/:type/:id?/export?format=` → `DocumentService.render`.
- `html`/`print`: real for 7 types (sale/purchase invoices, customer collection
  receipt, supplier payment receipt, customer/supplier statements, customer
  transaction statement). 8 registered report types have **no fetcher** → 501
  for every format (company/treasury/financial-movement/date-range/payment-method
  reports, financial summaries, supplier transaction statement).
- `pdf` (pdfkit + Amiri + UBA layer): real for 4 types only
  (SALE_INVOICE, PURCHASE_INVOICE, CUSTOMER_COLLECTION_RECEIPT,
  CUSTOMER_ACCOUNT_STATEMENT). Supplier receipt/statements + customer
  transaction statement → 501 despite HTML existing.
- `xlsx`/`csv`: always 501 even when the registry advertises them.

### 1.3 Print CSS inventory

- `DocumentPrintStyles.jsx` — canonical `@page A4 20mm`, hides
  `header/aside/nav`, thead repeat, row break rules. Mounted **only** on the
  (broken) treasury page.
- `InvoicePrintView` local `<style>` — visibility technique, invoice page only.
- `globals.css:162-178` — partner-dialog isolation only.
- Server `renderers/print.js` PRINT_CSS — only affects server docs in a new tab
  (already shell-free); auto-print script exists but is never enabled.

### 1.4 Root cause (printing)

The quick-print path calls `window.print()` on the full SPA route, but the
shared shell-hiding stylesheet is mounted on exactly one page (where it is
neutralized by a `print:hidden` ancestor). So most surfaces print the
dashboard/sidebar/nav. The server print path cannot compensate: it never fires
the print dialog. No screenshots/canvas libs exist anywhere (no html2canvas,
jsPDF, react-to-print) — nothing to remove; the fix is dedicated print
surfaces + mounting the existing shared styles, not new dependencies.

## 2. Current financial date architecture

### 2.1 Date origin and flow

`financial/page.jsx:getDateRange()/customDates` (browser `new Date()`) →
`useTreasury/useTreasuryTransactions/useCashFlow` (keys **do** include the
range: `['treasury',params]`, `['treasury-transactions',range,page,limit,…]`,
`['treasury-cashflow',range]`) → `financeService` (no transform) → Next proxy →
BE `treasuryRoutes/financeRoutes` → `treasuryService/exportService` (+
`lib/paginate.js: endOfDayIfDateOnly/boundedRange`) → Mongo `Date` fields →
response → UI `date-fns format` display.

### 2.2 Where it goes stale / shifts

1. **UTC off-by-one (biggest):** `new Date().toISOString().split('T')[0]` is UTC.
   Egypt is UTC+2/+3, so 00:00–02:59 local yields **yesterday**. Sites:
   FE `financial/page.jsx:66-67,93-94`, `daily-sales/page.jsx:31`,
   `financial/expenses/page.jsx:21`, `reports/profit-by-customer/page.jsx:22-23`;
   BE `treasuryPdfExport.js:44`, `exportService.js:295,306` (stamps).
2. **Frozen mount date:** `customDates` useState initializer runs once per mount;
   switching to CUSTOM after midnight reuses yesterday; the non-CUSTOM side
   input (`page.jsx:377`) displays that stale value.
3. **No day-rollover detector:** midnight change relies on a re-render + 30s poll;
   nothing invalidates on calendar-day flip.
4. **Missing EOD (same-day truncation):** `exportService` invoices (`:115`) and
   purchaseOrders (`:157`), `accountingService.getLedger`, `dailySalesService`
   ranges build `new Date(endDate)` = 00:00 → rows later that day excluded.
   Treasury export already uses `endOfDayIfDateOnly` — the fix is to apply the
   same helper uniformly (no semantic change, same pattern).
5. **UTC buckets:** `$dateToString` in `treasuryService.js:839-842` has no
   `timezone` arg → cash-flow days are UTC, late-evening Egypt transactions
   land in the next day. Fix: `timezone:'Africa/Cairo'`.
6. No hardcoded business dates exist anywhere (only tests/docs). DB stores real
   `Date`s; no seed scripts with fixed dates.

### 2.3 Root cause (dates)

No single stale constant: the "stuck date" is the combination of UTC-day
construction (wrong day near midnight), a mount-frozen custom range, and no
rollover invalidation — on top of server buckets/day-keys computed in host
(UTC) time instead of Egypt time.

## 3. Risk analysis

| Change | Risk | Why |
|---|---|---|
| Move treasury print view outside `print:hidden` (sibling) | SAFE | DOM placement only; screen rendering unchanged (`hidden print:block`) |
| Mount `DocumentPrintStyles` on receipt/PO/income pages | SAFE | Print-media CSS only; zero screen effect |
| Server preview honors `?autoprint=1` | LOW | Additive query flag; default behavior unchanged |
| `SupplierStatementTab` → `SUPPLIER_ACCOUNT_STATEMENT` | LOW | Fixes obviously wrong fetch; statement template exists |
| Local-day helper replacing `toISOString` day strings | LOW | Same intent (business day), correct TZ; query keys already range-scoped |
| Day-rollover invalidation | LOW | Targeted `invalidateQueries` on day flip; no extra polling |
| `endOfDayIfDateOnly` for invoices/POs/ledger/daily-sales exports | LOW | Identical pattern already shipped for treasury; strictly widens same-day inclusion |
| `$dateToString timezone:'Africa/Cairo'` | MEDIUM | Correct business buckets, but shifts late-evening bucket assignment — verify chart |
| `getSummary` window / `reportingService` null-date branches | HIGH (deferred) | Would change aggregation semantics — documented, NOT changed |
| Historical data, schemas, calculations | PROTECTED | Untouched by design |

## 4. Remediation plan (minimum safe)

1. Treasury print container fix + shared-style mounting (receipt/PO/income).
2. `autoprint` support + supplier statement type fix.
3. FE `lib/dates.js` (local business day, Cairo-safe), replace UTC day strings
   in the financial flow, rollover invalidation, fix stale side input.
4. BE EOD uniformity + Cairo cash-flow buckets.
5. Tests (print structure, date helper, buckets) + docs
   (`PRINTING_ARCHITECTURE.md`, `FINANCIAL_DATE_ARCHITECTURE.md`,
   `PRINTING_TEST_PLAN.md`); lint/build; commit per repo + push.

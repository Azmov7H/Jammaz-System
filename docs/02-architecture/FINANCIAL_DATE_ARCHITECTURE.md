# Financial Date Architecture

Business: Jammaz runs on Egypt wall-clock (Africa/Cairo, UTC+2/+3).

## Day-string rule

"Today" for filtering is a **local** `yyyy-MM-dd`, built only by
`src/lib/dates.js` (`toLocalYmd`/`todayLocal`, date-fns local formatting).
`new Date().toISOString().split('T')[0]` (UTC) is banned for day filters —
it returns yesterday during 00:00–02:59 Cairo time.

## Range construction (frontend)

`financial/page.jsx#getDateRange`: TODAY = local midnight→now, MONTH/YEAR =
period start→now (local strings), CUSTOM = explicit user dates. The selected
business day (`businessDay` state) is a dep of the range callback; a 60s
interval detects midnight rollover, re-anchors custom dates, resets paging,
and invalidates the date-scoped caches (`treasury`, `treasury-transactions`,
`treasury-cashflow` — keys already include the range, so no cross-day
poisoning). No aggressive polling: one timer, network only on flip.

## Server windows (backend)

- `lib/paginate.js#boundedRange` is the single choke point: date-only end
  bounds expand to end-of-day (idempotent), missing edges default, future
  clamped to now, span capped. All ledger/chart/export callers go through it.
- Cash-flow buckets aggregate with `$dateToString timezone:'Africa/Cairo'`
  so late-evening Cairo activity lands on the correct business day.
- `getSummary` keeps its own 7-day window (business behavior, unchanged);
  `reportingService` null-date branches are intentionally untouched (HIGH risk,
  documented in the audit).

## Untouched by design

Historical `Date` values, schemas, opening-balance math, running balances,
day-bucket writes. The fix changes only how dates are selected, interpreted,
queried, and displayed.

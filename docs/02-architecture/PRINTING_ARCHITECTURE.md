# Printing Architecture

## Principle

The application UI and the printable document are two different concerns.
Nothing in this architecture screenshots, photographs, or captures the viewport.
Every printable output is either:

1. a **dedicated print surface** (React HTML rendered for print, printed by the
   browser engine with native Arabic shaping/bidi), or
2. a **server-generated document** (HTML for preview/print, pdfkit PDF bytes
   for download) built from trusted business data via `DocumentService`.

## Layers

```text
Business data (invoices, receipts, statements, ledger rows)
  │  (no recalculation in the document layer — mappers only re-shape)
  ├─► Preview  (HTML/React on screen, or server HTML in a tab)
  ├─► Print    (dedicated print surface + @media print isolation)
  └─► PDF      (server pdfkit bytes via lib/pdf, Amiri + UBA)
```

## Print surfaces (frontend)

| Surface | File | Isolation |
|---|---|---|
| Invoice detail | `components/invoices/InvoicePrintView.jsx` (`#invoice-area` visibility technique) | local `<style>` |
| Treasury movement report | `components/financial/TreasuryPrintView.jsx` (`#treasury-print-area`, `hidden print:block`) | `DocumentPrintStyles` |
| Receipt detail, PO detail, income statement | page content + action bars marked `print:hidden` | `DocumentPrintStyles` (mounted per page) |
| Partner ledger dialog | `#print-area` minimal table | `globals.css` body-class technique |

Shared rules live in `components/documents/DocumentPrintStyles.jsx`
(`@page A4 20mm`, shell hiding, thead repeat, row break avoidance).
Constraint learned the hard way: a `print:block` print surface must be a
**sibling** of any `print:hidden` tree — never its child.

## Server documents (backend)

`DocumentService.render(type, params, format)` (`be-Jammaz/document/index.js`):
registry-gated formats → fetcher (allow-list validated) → renderer.
`format=print` returns standalone HTML with `PRINT_CSS`; `?autoprint=1` fires
`window.print()` on load. PDF renderers live in `document/renderers/pdf.js`
(statement renderers share one layout via party mapping).

## Data rule

Document mappers re-shape authoritative records (invoice totals, statement
running balances, ledger rows). Totals, taxes, discounts, balances are NEVER
recomputed in the print/PDF layer. The treasury print summary is reduced over
exactly the printed row set.

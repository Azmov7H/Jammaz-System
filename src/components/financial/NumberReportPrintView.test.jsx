/**
 * FIN-RPT-01 — number-report print output.
 *
 * The printed report must: keep per-number sections separated, show the
 * server grand total, render Arabic RTL with LTR-isolated numbers, and
 * contain no application chrome (sidebar / nav / buttons).
 */
import { render, screen, within } from '@testing-library/react';
import { NumberReportPrintView } from './NumberReportPrintView';
import { UNASSIGNED_LABEL } from '@/lib/numberReport';

const SECTIONS = [
    { number: '01012345678', received: 50000, withdrawn: 30000, count: 18, net: 20000 },
    { number: '01187654321', received: 25000, withdrawn: 12000, count: 9, net: 13000 },
];
const TOTALS = { received: 75000, withdrawn: 42000, count: 27, net: 33000 };

function renderReport(props = {}) {
    return render(
        <NumberReportPrintView
            forceVisible
            methodLabel="محفظة كاش"
            periodLabel="هذا الشهر"
            dateRange={{ startDate: '2026-09-01', endDate: '2026-09-12' }}
            sections={SECTIONS}
            totals={TOTALS}
            {...props}
        />
    );
}

describe('NumberReportPrintView', () => {
    it('renders one section per number with its own figures', () => {
        const { container } = renderReport();
        const area = container.querySelector('#number-report-print-area');
        expect(area).not.toBeNull();
        expect(area.getAttribute('dir')).toBe('rtl');
        for (const s of SECTIONS) {
            expect(screen.getByText(s.number)).toBeInTheDocument();
        }
        // Per-section net values are present alongside the grand total.
        expect(screen.getByText('20,000')).toBeInTheDocument();
        expect(screen.getByText('13,000')).toBeInTheDocument();
        expect(screen.getByText('33,000')).toBeInTheDocument();
    });

    it('isolates phone numbers and amounts LTR inside the RTL layout', () => {
        renderReport();
        expect(screen.getByText('01012345678').closest('[dir="ltr"]')).not.toBeNull();
    });

    it('labels number-less rows instead of leaking internals', () => {
        render(
            <NumberReportPrintView
                forceVisible
                sections={[{ number: '__unassigned', received: 100, withdrawn: 0, count: 1, net: 100 }]}
                totals={{ received: 100, withdrawn: 0, count: 1, net: 100 }}
            />
        );
        expect(screen.getByText(UNASSIGNED_LABEL)).toBeInTheDocument();
        expect(screen.queryByText('__unassigned')).toBeNull();
    });

    it('renders detail rows under their own number section', () => {
        renderReport({
            detailsByNumber: {
                '01012345678': [
                    { _id: 'a1', date: '2026-09-10T10:00:00', type: 'INCOME', amount: 5000, description: 'تحصيل', receiptNumber: 'R-1' },
                ],
            },
        });
        const section = screen.getByText('01012345678').closest('section');
        expect(within(section).getByText('تحصيل')).toBeInTheDocument();
        const other = screen.getByText('01187654321').closest('section');
        expect(within(other).queryByText('تحصيل')).toBeNull();
    });

    it('contains no application chrome', () => {
        const { container } = renderReport();
        const area = container.querySelector('#number-report-print-area');
        expect(area.querySelector('nav, aside, button, a')).toBeNull();
        expect(screen.queryByText(/تسجيل الدخول|القائمة/i)).toBeNull();
    });

    it('shows an empty state with zero sections', () => {
        renderReport({ sections: [], totals: {} });
        expect(screen.getByText(/لا توجد حركات/)).toBeInTheDocument();
    });
});

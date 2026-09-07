import { todayLocal, toLocalYmd, isSameLocalDay } from './dates';

describe('business-day helpers', () => {
    test('toLocalYmd uses local wall-clock, not UTC', () => {
        // 01:30 local. In Egypt (UTC+2/+3) the UTC calendar still shows
        // the previous day at this hour — the exact bug the helper fixes.
        const d = new Date(2026, 8, 7, 1, 30, 0);
        expect(toLocalYmd(d)).toBe('2026-09-07');
        // Only meaningful off-UTC; skipped when the runner itself is UTC.
        if (d.getTimezoneOffset() !== 0) {
            expect(d.toISOString().split('T')[0]).not.toBe('2026-09-07');
        }
    });

    test('todayLocal matches the local calendar day', () => {
        const now = new Date();
        const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        expect(todayLocal()).toBe(ymd);
    });

    test('isSameLocalDay compares calendar days, not instants', () => {
        expect(isSameLocalDay(new Date(2026, 8, 7, 0, 0), new Date(2026, 8, 7, 23, 59))).toBe(true);
        expect(isSameLocalDay(new Date(2026, 8, 7, 23, 59), new Date(2026, 8, 8, 0, 0))).toBe(false);
    });
});

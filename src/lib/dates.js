import { format } from 'date-fns';

/**
 * Business-day helpers (Africa/Cairo wall-clock safe).
 *
 * RULE: never build a "today" filter with
 * `new Date().toISOString().split('T')[0]` — that is UTC, and Egypt
 * (UTC+2/+3) spends 00:00–02:59 local on the *previous* UTC day.
 * `date-fns/format` uses the browser's local zone (Egypt for our users),
 * so it always yields the correct business day.
 */

/** Local `yyyy-MM-dd` for any Date — the canonical day-string builder. */
export function toLocalYmd(d = new Date()) {
    return format(d, 'yyyy-MM-dd');
}

/** Today in the user's (Egypt) local zone. */
export function todayLocal() {
    return toLocalYmd(new Date());
}

/** Start of the local day as a Date (for range construction). */
export function startOfLocalDay(d = new Date()) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

/** True when both values fall on the same local calendar day. */
export function isSameLocalDay(a, b) {
    return toLocalYmd(a) === toLocalYmd(b);
}

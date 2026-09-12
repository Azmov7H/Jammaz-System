'use client';

import { formatNumberKey } from '@/lib/numberReport';

/**
 * FIN-RPT-01 — per-number movement print report.
 *
 * Print-only view (`hidden print:block`), same architecture as
 * TreasuryPrintView: the browser renders the HTML with its native Arabic
 * shaping/bidi engine. Per-number sections preserve which rows belong to
 * which number; the grand total is server-computed and passed through.
 *
 * Data contract:
 * - `sections`: [{ number, received, withdrawn, count, net, rows? }]
 * - `totals`: { received, withdrawn, count, net } (server grand total)
 * - `detailsByNumber`: { [number]: tx[] } — optional paged detail rows for
 *   the printed numbers ({ date|createdAt, type, amount, description,
 *   receiptNumber, referenceType, sourceNumber }).
 */
const TYPE_AR = { INCOME: 'وارد', EXPENSE: 'صادر' };

function fmtDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return `${d.toLocaleDateString('ar-EG')} ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
}

function fmtAmount(value) {
    return Number(value ?? 0).toLocaleString('en-US');
}

export function NumberReportPrintView({ methodLabel = '', periodLabel = '', dateRange = {}, sections = [], totals = {}, detailsByNumber = {}, forceVisible = false }) {
    const rangeLabel = [dateRange.startDate, dateRange.endDate].filter(Boolean).join(' – ') || 'كامل السجل';
    const t = {
        received: Number(totals.received ?? 0),
        withdrawn: Number(totals.withdrawn ?? 0),
        count: Number(totals.count ?? 0),
        net: Number(totals.net ?? 0),
    };

    return (
        <div id="number-report-print-area" dir="rtl" className={forceVisible ? 'block bg-white text-slate-900' : 'hidden print:block bg-white text-slate-900'}>
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
                <h1 className="text-2xl font-bold">تقرير أرقام {methodLabel}</h1>
                <p className="text-sm text-slate-600 mt-1">
                    الفترة: {periodLabel} ({rangeLabel}) • عدد الأرقام: {sections.length.toLocaleString('en-US')} • عدد الحركات: {t.count.toLocaleString('en-US')}
                </p>
            </div>

            {sections.length === 0 ? (
                <p className="text-center text-slate-500 py-8">لا توجد حركات في هذه الفترة</p>
            ) : (
                sections.map((s) => {
                    const rows = detailsByNumber[s.number] ?? [];
                    return (
                        <section key={s.number} className="mb-6 break-inside-avoid">
                            <h2 className="text-lg font-bold border-b border-slate-300 pb-1 mb-2">
                                الرقم: <span dir="ltr" className="tabular-nums">{formatNumberKey(s.number)}</span>
                            </h2>
                            <div className="flex justify-between gap-4 text-sm mb-2">
                                <p><span className="font-bold">الوارد: </span><span dir="ltr">{fmtAmount(s.received)}</span> ج.م</p>
                                <p><span className="font-bold">الصادر: </span><span dir="ltr">{fmtAmount(s.withdrawn)}</span> ج.م</p>
                                <p><span className="font-bold">الصافي: </span><span dir="ltr">{fmtAmount(s.net)}</span> ج.م</p>
                                <p><span className="font-bold">الحركات: </span><span dir="ltr">{Number(s.count ?? 0).toLocaleString('en-US')}</span></p>
                            </div>
                            {rows.length > 0 && (
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="py-2 px-2 text-right">التاريخ</th>
                                            <th className="py-2 px-2 text-right">النوع</th>
                                            <th className="py-2 px-2 text-right">المبلغ</th>
                                            <th className="py-2 px-2 text-right">المرجع</th>
                                            <th className="py-2 px-2 text-right">الوصف</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((tx, i) => (
                                            <tr key={tx._id || i} className="border-b border-slate-200">
                                                <td className="py-1.5 px-2 whitespace-nowrap">{fmtDate(tx.date || tx.createdAt)}</td>
                                                <td className="py-1.5 px-2">{TYPE_AR[tx.type] || tx.type || ''}</td>
                                                <td className="py-1.5 px-2 font-bold whitespace-nowrap" dir="ltr">{fmtAmount(tx.amount)} ج.م</td>
                                                <td className="py-1.5 px-2 whitespace-nowrap" dir="ltr">{tx.receiptNumber || ''}</td>
                                                <td className="py-1.5 px-2">{tx.description || ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>
                    );
                })
            )}

            <div className="border-t-2 border-slate-900 pt-3 mt-2 flex justify-between gap-4 text-sm font-bold">
                <p>إجمالي الوارد: <span dir="ltr">{fmtAmount(t.received)}</span> ج.م</p>
                <p>إجمالي الصادر: <span dir="ltr">{fmtAmount(t.withdrawn)}</span> ج.م</p>
                <p>الصافي الكلي: <span dir="ltr">{fmtAmount(t.net)}</span> ج.م</p>
            </div>
        </div>
    );
}

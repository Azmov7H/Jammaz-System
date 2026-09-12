// Centralized payment-method definitions (Sprint 1 foundation — FIN-UI-000).
// Single source of truth for payment channels across the frontend.
// Keep in sync with the backend enum (be-Jammaz/models/TreasuryTransaction.js):
//   cash | bank | wallet | check | adjustment | instapay

import { Wallet, Landmark, Smartphone, Receipt, FileCheck, Scale, PiggyBank } from 'lucide-react';

// `icon`: lucide component for a distinct visual channel affordance (UX-002).
// `color`: tailwind text/bg tokens reusing existing success/destructive/warning/primary semantics (UX-002, 06.7).
export const PAYMENT_METHODS = [
  { value: 'cash',       labelAr: 'نقدي',      labelEn: 'Cash',          channel: 'private_treasury', channelLabelAr: 'الخزينة الخاصة', icon: Wallet,     color: 'text-emerald-600' },
  { value: 'bank',       labelAr: 'تحويل بنكي', labelEn: 'Bank Transfer',  channel: 'bank',           channelLabelAr: 'البنك',            icon: Landmark,   color: 'text-sky-600' },
  { value: 'wallet',     labelAr: 'محفظة كاش',  labelEn: 'Cash Wallet',    channel: 'cash_wallet',     channelLabelAr: 'محفظة الكاش',      icon: Smartphone, color: 'text-violet-600' },
  { value: 'instapay',   labelAr: 'انستا باي',  labelEn: 'InstaPay',      channel: 'instapay',        channelLabelAr: 'انستا باي',        icon: Receipt,    color: 'text-rose-600' },
  { value: 'check',      labelAr: 'شيك',        labelEn: 'Check',          channel: 'check',           channelLabelAr: 'الشيكات',          icon: FileCheck,  color: 'text-amber-600' },
  { value: 'adjustment', labelAr: 'تسوية',      labelEn: 'Adjustment',     channel: 'adjustment',      channelLabelAr: 'تسويات',           icon: Scale,      color: 'text-slate-500' },
  // FIN-TAHWEESH-04 (T-13): label/read-path only. Never add to an input
  // methods list without a business decision — spends route through
  // dedicated Tahweesh flows, not generic selectors.
  { value: 'tahweesh',   labelAr: 'تحويش',      labelEn: 'Tahweesh',       channel: 'tahweesh',        channelLabelAr: 'التحويش',           icon: PiggyBank,  color: 'text-teal-600' },
];

export const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map((m) => m.value);

export const PAYMENT_METHOD_LABELS_AR = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.labelAr])
);
export const PAYMENT_METHOD_LABELS_EN = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.labelEn])
);

// Treasury channels (cashbox breakdown). Mirrors CashboxDaily fields in be-Jammaz.
export const TREASURY_CHANNELS = [
  { value: 'private_treasury', labelAr: 'الخزينة الخاصة', labelEn: 'Private Treasury' },
  { value: 'bank',             labelAr: 'البنك',          labelEn: 'Bank' },
  { value: 'cash_wallet',      labelAr: 'محفظة الكاش',    labelEn: 'Cash Wallet' },
  { value: 'instapay',         labelAr: 'انستا باي',      labelEn: 'InstaPay' },
  { value: 'check',            labelAr: 'الشيكات',        labelEn: 'Check' },
  { value: 'adjustment',       labelAr: 'تسويات',         labelEn: 'Adjustment' },
];

// Source-number (transfer reference) is required for electronic channels on NEW
// transactions — enforced by the backend Zod schema in Sprint 3 (FIN-VAL-002).
export const isSourceNumberRequired = (method) =>
  method === 'instapay' || method === 'wallet';

export const getPaymentLabel = (value, locale = 'ar') =>
  (locale === 'en' ? PAYMENT_METHOD_LABELS_EN : PAYMENT_METHOD_LABELS_AR)[value] ?? value;

// Mask a transfer source number for display (PII-friendly, UX-005).
// Shows `••••` + last 4 digits (e.g. `•••• 4821`); blank/short collapse accordingly.
export const maskSource = (value) => {
  if (value == null || String(value).trim() === '') return '';
  const s = String(value).trim();
  if (s.length <= 4) return '••••';
  return `•••• ${s.slice(-4)}`;
};

// Re-export lucide icon lookup so importers can pull a method's icon/color.
export const getPaymentMethod = (value) =>
  PAYMENT_METHODS.find((m) => m.value === value) ?? null;

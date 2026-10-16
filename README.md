# نظام إدارة مخازن الجماز — الواجهة الأمامية

واجهة Next.js (App Router) لنظام إدارة المخازن والمالية.

## المكدّس (Stack)

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS 3** + الرموز (design tokens) في `src/app/globals.css`
- **Shadcn UI / Radix UI** للمكونات
- **TanStack Query** لحالة الخادم (data fetching/caching)
- **Zod** للتحقق (عند الحاجة)
- **Sonner** للتنبيهات (Toasts)

## المتطلبات

- Node.js 20+
- Backend (`be-Jammaz`) قيد التشغيل (الافتراضي: `http://127.0.0.1:5000`)
- MongoDB (محلي أو Atlas)

## إعداد البيئة (.env.local)

```bash
cp .env.example .env.local
```

Required keys:

- `JWT_SECRET` (يجب أن يطابق Backend)
- `API_PROXY_TARGET` (التطوير: `http://127.0.0.1:5000`)
- `NEXT_PUBLIC_API_URL` (عادةً فارغ، لاستخدام الـ proxy)

## التشغيل

```bash
pnpm install
pnpm dev
```

Opens: [http://localhost:3000](http://localhost:3000)

## سكربتات

```bash
pnpm dev        # تشغيل وضع التطوير
pnpm build      # بناء الإنتاج
pnpm start      # تشغيل بناء الإنتاج
pnpm lint       # فحص ESLint
pnpm test       # تشغيل Jest
```

## هيكلية المشروع

- `src/app/(public)` — صفحات عامة (تسجيل الدخول)
- `src/app/(protected)` — لوحة التحكم (shell مع Sidebar/Header)
- `src/components/ui` — primitives (Shadcn)
- `src/components` — مكونات alanma ويژة (accounting, financial, invoices, notifications...)
- `src/hooks` — hooks (TanStack Query wrappers)
- `src/utils` — `cn`, `formatCurrency`, `formatDate`
- `src/config/navigation.js` — إعدادات التنقل
- `src/providers` — Query/Sidebar providers
- `src/context` — contexts (Notifications)

## المصادقة (Authentication)

- JWT في HttpOnly cookie
- `next.config.mjs` يُعيد توجيه `/api/*` إلى `API_PROXY_TARGET`
- middleware يتحقق من الجلسة

## الإشعارات (Notifications)

- Backend يشغّل cron كل 5 دقائق (`NotificationService.syncAllAlerts()`)
- الواجهة تستعلم عبر `/api/notifications` مع polling/shadcn patterns

## التصميم (Design)

- RTL: `<html lang="ar" dir="rtl">`
- Shadcn UI (Radix)
- الحالة الموحدة: `LoadingState`, `EmptyState`, `ErrorState`
- جداول متجاوبة: `ResponsiveTable`
- breakpoints مخصصة (حتى ultra-wide) و `prefers-reduced-motion`

## الاختبارات (Testing)

```bash
pnpm test
```

Tests use Jest + Testing Library.

## Self-check

```bash
pnpm lint && pnpm test && pnpm build
```

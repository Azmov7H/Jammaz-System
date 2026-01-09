# Jammaz-System Architecture

## Overview
This document outlines the production-grade architecture of the Jammaz-System, as refactored.

## Core Principles
- **Clean Architecture**: Separation of concerns using Controller-Service-Model pattern.
- **Robust Security**: HttpOnly cookie-based JWT authentication with role-based access control (RBAC).
- **Scalable Routing**: Next.js App Router with Route Groups for clear distinction between public and protected areas.
- **Modern UI**: Tailwind CSS for styling, Framer Motion for animations, and Lucide React for iconography.

## Folder Structure
```
src/
├── app/
│   ├── (public)/          # Publicly accessible routes (Login, Error)
│   ├── (protected)/       # Authenticated dashboard routes
│   └── api/               # API route handlers (Controllers)
├── components/            # Reusable UI components
│   ├── ui/                # Core UI primitives
│   ├── layout/            # Layout components (Sidebar, Header)
│   └── [feature]/         # Feature-specific components
├── hooks/                 # Custom React hooks (React Query, etc.)
├── lib/
│   ├── services/          # Business logic (Service Layer)
│   ├── validators/        # Zod validation schemas
│   └── utils/             # Utility functions
├── models/                # Mongoose database models
└── providers/             # React context providers
```

## State Management
- **Server State**: Managed by `tanstack/react-query` for data fetching, caching, and synchronization.
- **Client State**: Minimal use of React Context for global UI states (Sidebar, Notifications).

## Security
- **Authentication**: JWT stored in HttpOnly cookies, verified via Middleware.
- **Authorization**: Middleware ensures token existence, while `lib/permissions.js` handles granular RBAC.

## Service Layer & Orchestration
The application employs a robust **Service Layer** to encapsulate business logic. API routes (Controllers) are lean and focus solely on:
1. Parsing requests.
2. Authenticating/Authorizing users.
3. Validating inputs with **Zod**.
4. Delegating to a dedicated **Service**.

Services (e.g., `FinanceService`, `InvoiceService`) are responsible for:
- Database interactions (Mongoose).
- Orchestrating complex logic across multiple domains (e.g., creating an invoice AND updating treasury).
- Maintaining business rules and constraints.

## Standardized API Pattern
All API routes follow a consistent pattern using `apiHandler` (found in `src/lib/api-handler.js`):
```javascript
export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = someSchema.parse(body);

    const result = await SomeService.execute(validated, user.userId);
    return NextResponse.json({ success: true, data: result });
});
```
This ensures:
- Automatic error handling (with specific support for Zod parsing errors).
- Standardized response format (`{ success: true, data: ... }` or `{ success: false, error: ... }`).
- Unified authentication flow.

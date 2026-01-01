# Jammaz System - Refactoring Guide

 This guide documents the architectural changes, new patterns, and best practices introduced during the comprehensive refactor of the Jammaz System. It serves as a reference for future development.

## 🏗 Project Architecture

### Directory Structure
The project follows the **Next.js App Router** structure with a focus on modularity and atomic design.

```
src/
├── app/                    # App Router pages and API routes
│   ├── (dashboard)/        # Protected routes (Dashboard layout)
│   ├── api/                # API Endpoints (Controller layer)
│   └── login/              # Public routes
├── components/             # UI Components
│   ├── ui/                 # Atomic/Generic UI components (Button, Input, etc.)
│   ├── [module]/           # Domain-specific components (products, invoices, etc.)
│   └── ...
├── hooks/                  # Custom React Hooks (Data fetching, logic)
├── lib/                    # Utilities and Shared Logic
│   ├── services/           # Business Logic Layer (Database interactions)
│   ├── validators/         # Zod Schemas for validation
│   └── ...
└── providers/              # React Context Providers
```

### Key Technologies
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + CSS Variables (Theming) + Framer Motion (Animations)
- **State Management**: React Query (Server state) + Context API (Global UI state)
- **Validation**: Zod (API & Forms)
- **Icons**: Lucide React

---

## 🛠 Backend Patterns

We adopted a **Controller-Service-Model** pattern to separate concerns.

### 1. API Route (Controller)
Located in `src/app/api/[resource]/route.js`.
- Handles HTTP request/response.
- Validates input using Zod.
- Checks permissions.
- Calls the Service layer.
- Handles errors centrally via `apiHandler`.

**Example:**
```javascript
import { apiHandler } from '@/lib/api-handler';
import { productService } from '@/lib/services/productService';
import { productSchema } from '@/lib/validators';

export const GET = apiHandler(async (req) => {
    return await productService.getAll(req.nextUrl.searchParams);
});

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = productSchema.parse(body);
    return await productService.create(validated);
});
```

### 2. Service Layer
Located in `src/lib/services/`.
- Contains all business logic.
- Interacts with Mongoose models.
- **Never** accesses `req` or `res` objects directly.

### 3. Error Handling
Always use `apiHandler` wrapper for API routes. It automatically catches errors and returns standardized JSON responses.

---

## 🎨 Frontend Patterns

### 1. Atomic UI Components
Generic, reusable components are in `src/components/ui/`.
- **Do not modify** these for specific business logic.
- Use props (variants, sizes) to customize appearance.
- Example: `<Button variant="destructive">Delete</Button>`

### 2. Data Fetching (React Query)
Custom hooks in `src/hooks/` encapsulate data fetching logic.
- **Naming**: `use[Resource]`, `useAdd[Resource]`, etc.
- **Caching**: Configured in `QueryProvider`.
- **Usage**:
```javascript
const { data: products, isLoading } = useProducts();
const { mutate: addProduct } = useAddProduct();
```

### 3. Feature Components
Complex UI sections (Forms, Dialogs, Lists) are extracted into `src/components/[module]/`.
- **Dialogs**: Should control their own open state if possible, or be controlled by the parent page via props.
- **Forms**: Use managed state or `react-hook-form` (if referenced).

---

## 🚀 Adding a New Feature

1. **Backend**:
    - Define Zod schema in `src/lib/validators.js`.
    - Create/Update Mongoose model in `src/models/`.
    - Create Service functions in `src/lib/services/`.
    - Create API Route in `src/app/api/`.

2. **Frontend**:
    - Create React Query hooks in `src/hooks/`.
    - Create page in `src/app/(dashboard)/`.
    - Extract complex logic into components in `src/components/[feature]/`.

---

## 🧹 Best Practices

- **Mobile First**: Always test layouts on mobile screens via DevTools. Use `md:`, `lg:` prefixes for desktop styles.
- **Validation**: Validate on both client (HTML5/State) and server (Zod).
- **Performance**: Use `next/image` for images. Use dynamic imports for heavy components (like Dialogs).
- **Security**: Never expose sensitive data in API responses. Use `lean()` for read-only queries.

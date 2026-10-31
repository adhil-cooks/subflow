# Subflow — Project Documentation

## 1. Purpose

Subflow is a subscription management platform that helps businesses manage customers, products, plans, subscriptions, invoices and payments.

The goal is to provide a simple, centralized interface for managing the complete subscription lifecycle.

## 2. User Roles

### Admin
- Access the business dashboard.
- Manage staff and customers.
- Manage products and subscription plans.
- Manage subscriptions, invoices and payments.
- View business reports.

### Staff
- Access permitted operational modules.
- Manage assigned customers and related records.
- Assist with subscription and payment operations.

### Customer
- View their own subscription information.
- View their invoices and payment history.
- Access only their own permitted records.

The exact permissions must be enforced by the backend and Supabase Row Level Security (RLS), not just by hiding UI elements.

## 3. Core Modules

1. Dashboard
2. Authentication and user management
3. Customers
4. Products and variants
5. Subscription plans
6. Subscriptions
7. Invoices
8. Payments
9. Reports

## 4. Technology

- Next.js App Router
- React and TypeScript
- Tailwind CSS v4
- shadcn/ui with Base UI
- Supabase PostgreSQL
- Supabase Auth
- Zod
- Recharts
- Lucide React
- Vercel

## 5. Architecture

### Frontend

The frontend is responsible for:
- Rendering pages and layouts.
- Forms and user interactions.
- Tables, filters and dashboards.
- Loading, empty and error states.
- Client-side input feedback.

### Backend

Use Next.js Server Actions and Route Handlers for server-side operations.

Business operations that require authorization or privileged access must be validated on the server.

### Database

Supabase PostgreSQL stores application data.

Supabase RLS policies must restrict access based on authenticated users and their roles.

## 6. Important Business Rules

### Subscriptions
- Validate subscription status transitions on the server.
- Track start date, billing interval and next billing date.
- Do not assume recurring invoices are generated automatically unless a scheduled process is implemented.

### Invoices
- Store invoice line-item snapshots.
- Preserve the product or plan description, quantity, price and applicable tax at the time of invoicing.
- Prevent duplicate invoices for the same subscription and billing period using database constraints or idempotency.

### Payments
- Support partial payments.
- Calculate outstanding balance from invoice total minus recorded payments.
- Mark an invoice as paid only when its outstanding balance is zero.

### Money
- Use PostgreSQL `numeric` for monetary values.
- Avoid floating-point arithmetic for final billing calculations.

### Security
- Never expose Supabase service-role keys in browser code.
- Enforce customer ownership through RLS.
- Validate all sensitive operations on the server.

## 7. Team Ownership

| Member | Ownership |
|---|---|
| Adhil | Frontend integration and dashboard |
| Adharsh | Frontend feature pages |
| Arrow | Supabase foundation, authentication, schema and RLS |
| Arjun | Subscription, invoice, payment and billing logic |

Coordinate before changing shared database contracts or components.

## 8. Optional AI Feature

Gemini API integration may be added later as an optional assistance feature.

It is not part of the critical MVP path. API keys must remain server-side.

## 9. MVP Completion Criteria

- Users can authenticate.
- Role-based access is enforced.
- Admin can manage customers, products and plans.
- Subscriptions can be created and managed.
- Invoices can be generated and viewed.
- Payments can be recorded, including partial payments.
- Dashboard displays meaningful business information.
- Core flows work with real Supabase data.
- Production build succeeds.
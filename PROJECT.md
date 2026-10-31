# Project Specification: SaaS Billing & Subscription Engine

## 1. Overview
This project provides a robust, multi-tenant capable SaaS subscription and billing platform.
The architecture is divided into clear domain responsibilities:
- **Core Foundation (Arrow)**: Customers, Products, Plans, Database migrations foundation.
- **Subscription & Billing Domain (Arjun)**: Subscriptions, Invoices, Payments, Billing interval calculations, Idempotency/Duplicate prevention, Financial calculations, Dashboard metrics.
- **Frontend / Client UI (Adharsh & Adhil)**: Payment flows, customer management, dashboard views, subscription status displays.

## 2. Core Tables (Arrow)
- `customers(id UUID, name TEXT, email TEXT, created_at TIMESTAMPTZ)`
- `products(id UUID, name TEXT, description TEXT, is_active BOOLEAN)`
- `plans(id UUID, product_id UUID, name TEXT, price NUMERIC(12, 2), billing_interval TEXT, currency TEXT)`

## 3. Billing Domain Tables (Arjun)
- `subscriptions`: Manages customer subscriptions, lifecycle status, billing periods, and cancellation state.
- `invoices`: Tracks billing cycles, line item amounts, tax, paid amounts, status, and due dates.
- `invoice_items`: Preserves item pricing snapshots (description, quantity, unit price, tax rate, total).
- `payments`: Records customer payment attempts, partial payments, payment methods, transaction references, and statuses.

## 4. Key Business Logic & Rules
1. **Financial Precision**: All monetary values are represented as exact decimals (`numeric(12, 2)` in PostgreSQL / `Decimal` in application logic). No floating-point calculations for final balances.
2. **Subscription Lifecycle & Transitions**:
   - `trialing` -> `active`, `cancelled`
   - `active` -> `paused`, `past_due`, `cancelled`
   - `paused` -> `active`, `cancelled`
   - `past_due` -> `active` (upon payment), `cancelled`
   - `cancelled` -> terminal
3. **Billing Intervals & Calculations**: Supports `weekly`, `monthly`, `quarterly`, `yearly`. Accurately calculates `current_period_start`, `current_period_end`, and `next_billing_date`.
4. **Invoice Generation & Snapshots**: Freezes pricing and descriptions into `invoice_items` at generation time to protect against future catalog changes.
5. **Duplicate Invoice Prevention**: Unique constraint on `(subscription_id, billing_period_start, billing_period_end)` for all active/non-void invoices prevents duplicate invoicing for the same cycle.
6. **Payment Recording & Balances**: Supports multiple partial payments. Invoice status updates to `paid` if and only if `amount_paid >= total_amount`.
7. **Billing Dashboard Data**:
   - Active, trialing, paused, past due subscription counts.
   - Total collected revenue.
   - Outstanding invoice count & total outstanding balance.
   - Overdue billing count & amount.

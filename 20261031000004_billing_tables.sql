-- supabase/migrations/20261031000004_billing_tables.sql
-- Billing Domain Migration (Subscriptions, Invoices, Invoice Items, Payments)
-- Author: Arjun (Subscription & Billing Development)

-- 1. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'paused', 'past_due', 'cancelled')),
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    next_billing_date TIMESTAMPTZ NOT NULL,
    trial_end TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 2. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    discount_id UUID REFERENCES public.discounts(id) ON DELETE SET NULL,
    coupon_code TEXT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- Duplicate invoice prevention per docs/PROJECT.md Section 6
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_subscription_period 
ON public.invoices (subscription_id, billing_period_start, billing_period_end) 
WHERE subscription_id IS NOT NULL AND status != 'void';

-- 3. Invoice Items Table (Historical Snapshots)
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- 4. Payments Table (Partial Payments & Balance Tracking)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'bank_transfer', 'cash', 'other')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    transaction_reference TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- -------------------------------------------------------------
-- 5. Row-Level Security (RLS) Policies
-- -------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper check for staff/admin role
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'role' IN ('admin', 'staff') OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'staff')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Subscriptions RLS
CREATE POLICY "Staff can manage all subscriptions"
ON public.subscriptions FOR ALL
USING (public.is_admin_or_staff());

CREATE POLICY "Customers can view own subscriptions"
ON public.subscriptions FOR SELECT
USING (
    customer_id IN (
        SELECT id FROM public.customers WHERE profile_id = auth.uid()
    )
);

-- Invoices RLS
CREATE POLICY "Staff can manage all invoices"
ON public.invoices FOR ALL
USING (public.is_admin_or_staff());

CREATE POLICY "Customers can view own invoices"
ON public.invoices FOR SELECT
USING (
    customer_id IN (
        SELECT id FROM public.customers WHERE profile_id = auth.uid()
    )
);

-- Invoice Items RLS
CREATE POLICY "Staff can manage all invoice items"
ON public.invoice_items FOR ALL
USING (public.is_admin_or_staff());

CREATE POLICY "Customers can view own invoice items"
ON public.invoice_items FOR SELECT
USING (
    invoice_id IN (
        SELECT id FROM public.invoices WHERE customer_id IN (
            SELECT id FROM public.customers WHERE profile_id = auth.uid()
        )
    )
);

-- Payments RLS
CREATE POLICY "Staff can manage all payments"
ON public.payments FOR ALL
USING (public.is_admin_or_staff());

CREATE POLICY "Customers can view own payments"
ON public.payments FOR SELECT
USING (
    invoice_id IN (
        SELECT id FROM public.invoices WHERE customer_id IN (
            SELECT id FROM public.customers WHERE profile_id = auth.uid()
        )
    )
);

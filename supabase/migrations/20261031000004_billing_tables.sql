-- Migration: 20261031000004_billing_tables.sql
-- Description: Implement subscriptions, invoices, invoice_items, and payments tables with strict numeric precision, idempotency, and RLS.

-- 1. Custom Types / Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('trialing', 'active', 'paused', 'past_due', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type public.invoice_status as enum ('draft', 'open', 'paid', 'void', 'uncollectible');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('credit_card', 'bank_transfer', 'stripe', 'cash', 'other');
  end if;
end $$;

-- 2. Subscriptions Table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'active'::public.subscription_status,
  billing_interval public.billing_interval not null default 'monthly'::public.billing_interval,
  currency text not null default 'USD',
  unit_price numeric(12, 2) not null default 0.00 check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  start_date timestamptz not null default timezone('utc'::text, now()),
  current_period_start timestamptz not null default timezone('utc'::text, now()),
  current_period_end timestamptz not null,
  trial_start timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  next_billing_date timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_subscriptions_updated on public.subscriptions;
create trigger on_subscriptions_updated
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

create index if not exists idx_subscriptions_customer_id on public.subscriptions(customer_id);
create index if not exists idx_subscriptions_plan_id on public.subscriptions(plan_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_next_billing_date on public.subscriptions(next_billing_date);

-- 3. Invoices Table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  discount_id uuid references public.discounts(id) on delete set null,
  status public.invoice_status not null default 'draft'::public.invoice_status,
  currency text not null default 'USD',
  subtotal numeric(12, 2) not null default 0.00 check (subtotal >= 0),
  discount_amount numeric(12, 2) not null default 0.00 check (discount_amount >= 0),
  tax_amount numeric(12, 2) not null default 0.00 check (tax_amount >= 0),
  total_amount numeric(12, 2) not null default 0.00 check (total_amount >= 0),
  amount_paid numeric(12, 2) not null default 0.00 check (amount_paid >= 0),
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  issue_date timestamptz not null default timezone('utc'::text, now()),
  due_date timestamptz not null,
  paid_at timestamptz,
  voided_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_invoices_updated on public.invoices;
create trigger on_invoices_updated
  before update on public.invoices
  for each row execute function public.handle_updated_at();

-- Idempotency constraint: Prevent duplicate invoices for the same subscription and period
create unique index if not exists idx_unique_subscription_period
  on public.invoices (subscription_id, billing_period_start, billing_period_end)
  where subscription_id is not null;

create index if not exists idx_invoices_customer_id on public.invoices(customer_id);
create index if not exists idx_invoices_subscription_id on public.invoices(subscription_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_due_date on public.invoices(due_date);

-- 4. Invoice Items Table (Frozen Historical Snapshot)
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  tax_rate numeric(5, 2) not null default 0.00 check (tax_rate >= 0),
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_invoice_items_updated on public.invoice_items;
create trigger on_invoice_items_updated
  before update on public.invoice_items
  for each row execute function public.handle_updated_at();

create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);

-- 5. Payments Table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  payment_method public.payment_method not null default 'credit_card'::public.payment_method,
  status public.payment_status not null default 'succeeded'::public.payment_status,
  transaction_reference text,
  payment_date timestamptz not null default timezone('utc'::text, now()),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_payments_updated on public.payments;
create trigger on_payments_updated
  before update on public.payments
  for each row execute function public.handle_updated_at();

create index if not exists idx_payments_invoice_id on public.payments(invoice_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_payment_date on public.payments(payment_date);

-- 6. Helper Function & Trigger: Automatic Invoice Payment & Balance Synchronization
create or replace function public.sync_invoice_payments()
returns trigger as $$
declare
  target_invoice_id uuid;
  total_paid numeric(12, 2);
  current_invoice public.invoices%rowtype;
begin
  if (tg_op = 'DELETE') then
    target_invoice_id := old.invoice_id;
  else
    target_invoice_id := new.invoice_id;
  end if;

  select coalesce(sum(amount), 0.00)
    into total_paid
    from public.payments
   where invoice_id = target_invoice_id
     and status = 'succeeded';

  select * into current_invoice from public.invoices where id = target_invoice_id;

  if found then
    update public.invoices
       set amount_paid = total_paid,
           status = case
             when current_invoice.status in ('void', 'uncollectible') then current_invoice.status
             when total_paid >= current_invoice.total_amount and current_invoice.total_amount > 0 then 'paid'::public.invoice_status
             when current_invoice.status = 'paid' and total_paid < current_invoice.total_amount then 'open'::public.invoice_status
             when total_paid > 0 and current_invoice.status = 'draft' then 'open'::public.invoice_status
             else current_invoice.status
           end,
           paid_at = case
             when total_paid >= current_invoice.total_amount and current_invoice.total_amount > 0 then coalesce(current_invoice.paid_at, timezone('utc'::text, now()))
             else null
           end,
           updated_at = timezone('utc'::text, now())
     where id = target_invoice_id;
  end if;

  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_payment_change_sync_invoice on public.payments;
create trigger on_payment_change_sync_invoice
  after insert or update or delete on public.payments
  for each row execute function public.sync_invoice_payments();

-- 7. Enable Row Level Security (RLS)
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

-- 8. RLS Policies: SUBSCRIPTIONS
drop policy if exists "Staff and Admin can manage all subscriptions" on public.subscriptions;
create policy "Staff and Admin can manage all subscriptions"
  on public.subscriptions for all
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "Customers can view their own subscriptions" on public.subscriptions;
create policy "Customers can view their own subscriptions"
  on public.subscriptions for select
  using (
    customer_id in (
      select id from public.customers where profile_id = auth.uid()
    )
  );

-- 9. RLS Policies: INVOICES
drop policy if exists "Staff and Admin can manage all invoices" on public.invoices;
create policy "Staff and Admin can manage all invoices"
  on public.invoices for all
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "Customers can view their own invoices" on public.invoices;
create policy "Customers can view their own invoices"
  on public.invoices for select
  using (
    customer_id in (
      select id from public.customers where profile_id = auth.uid()
    )
  );

-- 10. RLS Policies: INVOICE ITEMS
drop policy if exists "Staff and Admin can manage all invoice items" on public.invoice_items;
create policy "Staff and Admin can manage all invoice items"
  on public.invoice_items for all
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "Customers can view their own invoice items" on public.invoice_items;
create policy "Customers can view their own invoice items"
  on public.invoice_items for select
  using (
    invoice_id in (
      select inv.id from public.invoices inv
      join public.customers c on c.id = inv.customer_id
      where c.profile_id = auth.uid()
    )
  );

-- 11. RLS Policies: PAYMENTS
drop policy if exists "Staff and Admin can manage all payments" on public.payments;
create policy "Staff and Admin can manage all payments"
  on public.payments for all
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "Customers can view their own payments" on public.payments;
create policy "Customers can view their own payments"
  on public.payments for select
  using (
    invoice_id in (
      select inv.id from public.invoices inv
      join public.customers c on c.id = inv.customer_id
      where c.profile_id = auth.uid()
    )
  );

-- Migration: 20261031000003_plans_taxes_discounts.sql
-- Description: Implement database support for plans, plan_items, discounts, and tax_rates with RLS.

-- 1. Custom Types
do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_status') then
    create type public.plan_status as enum ('active', 'inactive', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'billing_interval') then
    create type public.billing_interval as enum ('weekly', 'monthly', 'quarterly', 'yearly');
  end if;
  if not exists (select 1 from pg_type where typname = 'discount_type') then
    create type public.discount_type as enum ('percentage', 'fixed_amount');
  end if;
end $$;

-- 2. Plans Table
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  description text,
  billing_interval public.billing_interval not null default 'monthly'::public.billing_interval,
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'USD',
  trial_period_days integer not null default 0 check (trial_period_days >= 0),
  status public.plan_status not null default 'active'::public.plan_status,
  features jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_plans_updated on public.plans;
create trigger on_plans_updated
  before update on public.plans
  for each row execute function public.handle_updated_at();

create index if not exists idx_plans_product_id on public.plans(product_id);
create index if not exists idx_plans_status on public.plans(status);
create index if not exists idx_plans_billing_interval on public.plans(billing_interval);

-- 3. Plan Items Table (Bundled items or allowances)
create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null default 0.00 check (unit_price >= 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_plan_items_updated on public.plan_items;
create trigger on_plan_items_updated
  before update on public.plan_items
  for each row execute function public.handle_updated_at();

create index if not exists idx_plan_items_plan_id on public.plan_items(plan_id);

-- 4. Discounts Table (Coupons / Promotions)
create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type public.discount_type not null default 'percentage'::public.discount_type,
  value numeric(12, 2) not null check (value > 0),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  times_redeemed integer not null default 0 check (times_redeemed >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_discounts_updated on public.discounts;
create trigger on_discounts_updated
  before update on public.discounts
  for each row execute function public.handle_updated_at();

create index if not exists idx_discounts_code on public.discounts(upper(code));
create index if not exists idx_discounts_is_active on public.discounts(is_active);

-- 5. Tax Rates Table
create table if not exists public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rate numeric(5, 2) not null check (rate >= 0 and rate <= 100),
  country text,
  state text,
  is_compound boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_tax_rates_updated on public.tax_rates;
create trigger on_tax_rates_updated
  before update on public.tax_rates
  for each row execute function public.handle_updated_at();

create index if not exists idx_tax_rates_is_active on public.tax_rates(is_active);

-- 6. Enable RLS
alter table public.plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.discounts enable row level security;
alter table public.tax_rates enable row level security;

-- 7. RLS Policies: PLANS
drop policy if exists "Active plans are viewable by authenticated users" on public.plans;
create policy "Active plans are viewable by authenticated users"
  on public.plans for select
  using (status = 'active'::public.plan_status or public.is_staff_or_admin());

drop policy if exists "Staff and Admin can manage plans" on public.plans;
create policy "Staff and Admin can manage plans"
  on public.plans for insert
  with check (public.is_staff_or_admin());

drop policy if exists "Staff and Admin can update plans" on public.plans;
create policy "Staff and Admin can update plans"
  on public.plans for update
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "Only Admin can delete plans" on public.plans;
create policy "Only Admin can delete plans"
  on public.plans for delete
  using (public.is_admin());

-- 8. RLS Policies: PLAN ITEMS
drop policy if exists "Plan items are viewable by authenticated users" on public.plan_items;
create policy "Plan items are viewable by authenticated users"
  on public.plan_items for select
  using (
    exists (
      select 1 from public.plans p
      where p.id = plan_id and (p.status = 'active'::public.plan_status or public.is_staff_or_admin())
    )
  );

drop policy if exists "Staff and Admin can manage plan items" on public.plan_items;
create policy "Staff and Admin can manage plan items"
  on public.plan_items for all
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- 9. RLS Policies: DISCOUNTS
drop policy if exists "Active discounts viewable by authenticated users, staff views all" on public.discounts;
create policy "Active discounts viewable by authenticated users, staff views all"
  on public.discounts for select
  using (is_active = true or public.is_staff_or_admin());

drop policy if exists "Staff and Admin can manage discounts" on public.discounts;
create policy "Staff and Admin can manage discounts"
  on public.discounts for all
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- 10. RLS Policies: TAX RATES
drop policy if exists "Active tax rates viewable by authenticated users, staff views all" on public.tax_rates;
create policy "Active tax rates viewable by authenticated users, staff views all"
  on public.tax_rates for select
  using (is_active = true or public.is_staff_or_admin());

drop policy if exists "Staff and Admin can manage tax rates" on public.tax_rates;
create policy "Staff and Admin can manage tax rates"
  on public.tax_rates for all
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

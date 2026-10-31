-- Migration: 20261031000001_initial_database_foundation.sql
-- Description: Core schema foundation for profiles, customers, products, and product variants.

-- 1. Custom Types
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'staff', 'customer');
  end if;
  if not exists (select 1 from pg_type where typname = 'customer_status') then
    create type public.customer_status as enum ('active', 'inactive', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type public.product_status as enum ('draft', 'active', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'variant_status') then
    create type public.variant_status as enum ('active', 'inactive');
  end if;
end $$;

-- 2. Generic updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- 3. Profiles Table (linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'customer'::public.user_role,
  avatar_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Automatic profile creation on auth user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer'::public.user_role)
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name != '' then excluded.full_name else public.profiles.full_name end;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Customers Table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  company text,
  billing_address jsonb not null default '{}'::jsonb,
  shipping_address jsonb not null default '{}'::jsonb,
  status public.customer_status not null default 'active'::public.customer_status,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_customers_updated on public.customers;
create trigger on_customers_updated
  before update on public.customers
  for each row execute function public.handle_updated_at();

create index if not exists idx_customers_email on public.customers(email);
create index if not exists idx_customers_profile_id on public.customers(profile_id);
create index if not exists idx_customers_status on public.customers(status);

-- 5. Products Table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  status public.product_status not null default 'active'::public.product_status,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_products_updated on public.products;
create trigger on_products_updated
  before update on public.products
  for each row execute function public.handle_updated_at();

create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_category on public.products(category);

-- 6. Product Variants Table
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text unique,
  price numeric(12, 2) not null check (price >= 0),
  attributes jsonb not null default '{}'::jsonb,
  status public.variant_status not null default 'active'::public.variant_status,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists on_product_variants_updated on public.product_variants;
create trigger on_product_variants_updated
  before update on public.product_variants
  for each row execute function public.handle_updated_at();

create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_product_variants_sku on public.product_variants(sku);
create index if not exists idx_product_variants_status on public.product_variants(status);

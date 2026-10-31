-- Migration: 20261031000002_row_level_security.sql
-- Description: Implement Row Level Security (RLS) and role protection for profiles, customers, products, and variants.

-- 1. Helper Security Functions (SECURITY DEFINER to avoid RLS recursion)
create or replace function public.get_current_user_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.is_admin()
returns boolean as $$
  select coalesce((public.get_current_user_role() = 'admin'::public.user_role), false);
$$ language sql security definer stable;

create or replace function public.is_staff_or_admin()
returns boolean as $$
  select coalesce((public.get_current_user_role() in ('admin'::public.user_role, 'staff'::public.user_role)), false);
$$ language sql security definer stable;

-- 2. Prevent role escalation during signup and update
-- Always force new signups to 'customer' role
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'::public.user_role -- Always defaults to customer regardless of metadata
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name != '' then excluded.full_name else public.profiles.full_name end;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to prevent non-admins from changing the role column in profiles
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Unauthorized: Only administrators can modify user roles';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_protect_profile_role on public.profiles;
create trigger on_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- 3. Enable RLS on all foundation tables
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

-- 4. RLS Policies: PROFILES
drop policy if exists "Users can view their own profile or staff can view all" on public.profiles;
create policy "Users can view their own profile or staff can view all"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_staff_or_admin()
  );

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. RLS Policies: CUSTOMERS
drop policy if exists "Staff and Admin can view all customers, Customer views own" on public.customers;
create policy "Staff and Admin can view all customers, Customer views own"
  on public.customers for select
  using (
    public.is_staff_or_admin()
    or (profile_id is not null and profile_id = auth.uid())
  );

drop policy if exists "Staff and Admin can insert customers" on public.customers;
create policy "Staff and Admin can insert customers"
  on public.customers for insert
  with check (public.is_staff_or_admin());

drop policy if exists "Staff and Admin can update customers" on public.customers;
create policy "Staff and Admin can update customers"
  on public.customers for update
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "Only Admin can delete customers" on public.customers;
create policy "Only Admin can delete customers"
  on public.customers for delete
  using (public.is_admin());

-- 6. RLS Policies: PRODUCTS
drop policy if exists "Anyone authenticated can view active products, staff views all" on public.products;
create policy "Anyone authenticated can view active products, staff views all"
  on public.products for select
  using (
    status = 'active'::public.product_status
    or public.is_staff_or_admin()
  );

drop policy if exists "Staff and Admin can insert products" on public.products;
create policy "Staff and Admin can insert products"
  on public.products for insert
  with check (public.is_staff_or_admin());

drop policy if exists "Staff and Admin can update products" on public.products;
create policy "Staff and Admin can update products"
  on public.products for update
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "Only Admin can delete products" on public.products;
create policy "Only Admin can delete products"
  on public.products for delete
  using (public.is_admin());

-- 7. RLS Policies: PRODUCT VARIANTS
drop policy if exists "Anyone authenticated can view active variants, staff views all" on public.product_variants;
create policy "Anyone authenticated can view active variants, staff views all"
  on public.product_variants for select
  using (
    status = 'active'::public.variant_status
    or public.is_staff_or_admin()
  );

drop policy if exists "Staff and Admin can insert variants" on public.product_variants;
create policy "Staff and Admin can insert variants"
  on public.product_variants for insert
  with check (public.is_staff_or_admin());

drop policy if exists "Staff and Admin can update variants" on public.product_variants;
create policy "Staff and Admin can update variants"
  on public.product_variants for update
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "Only Admin can delete variants" on public.product_variants;
create policy "Only Admin can delete variants"
  on public.product_variants for delete
  using (public.is_admin());

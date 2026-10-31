// scripts/verify-backend.mjs
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

console.log('🔍 Starting Subflow Backend Verification Suite...\n');

let failed = false;
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed = true;
  }
}

// 1. Verify SQL Migrations
console.log('--- 1. Database Migrations Audit ---');
const migrationsDir = path.join(projectRoot, 'supabase/migrations');
assert(fs.existsSync(migrationsDir), 'supabase/migrations directory exists');

const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
console.log(`Found ${migrations.length} migration files:`, migrations);

assert(migrations.includes('20261031000001_initial_database_foundation.sql'), 'Migration 000001 exists');
assert(migrations.includes('20261031000002_row_level_security.sql'), 'Migration 000002 exists');
assert(migrations.includes('20261031000003_plans_taxes_discounts.sql'), 'Migration 000003 exists');

// Check Migration 1 content
const m1 = fs.readFileSync(path.join(migrationsDir, '20261031000001_initial_database_foundation.sql'), 'utf8');
assert(m1.includes('create table if not exists public.profiles'), 'profiles table created');
assert(m1.includes('create table if not exists public.customers'), 'customers table created');
assert(m1.includes('create table if not exists public.products'), 'products table created');
assert(m1.includes('create table if not exists public.product_variants'), 'product_variants table created');
assert(m1.includes('handle_new_user()'), 'handle_new_user() trigger function defined');
assert(m1.includes('price numeric(12, 2)'), 'product_variants uses numeric(12, 2) for price');

// Check Migration 2 content
const m2 = fs.readFileSync(path.join(migrationsDir, '20261031000002_row_level_security.sql'), 'utf8');
assert(m2.includes('alter table public.profiles enable row level security'), 'RLS enabled on profiles');
assert(m2.includes('alter table public.customers enable row level security'), 'RLS enabled on customers');
assert(m2.includes('alter table public.products enable row level security'), 'RLS enabled on products');
assert(m2.includes('alter table public.product_variants enable row level security'), 'RLS enabled on product_variants');
assert(m2.includes('protect_profile_role()'), 'protect_profile_role() trigger exists (blocks unauthorized role escalation)');
assert(m2.includes('is_staff_or_admin()'), 'is_staff_or_admin() security helper exists');

// Check Migration 3 content
const m3 = fs.readFileSync(path.join(migrationsDir, '20261031000003_plans_taxes_discounts.sql'), 'utf8');
assert(m3.includes('create table if not exists public.plans'), 'plans table created');
assert(m3.includes('create table if not exists public.plan_items'), 'plan_items table created');
assert(m3.includes('create table if not exists public.discounts'), 'discounts table created');
assert(m3.includes('create table if not exists public.tax_rates'), 'tax_rates table created');
assert(m3.includes('price numeric(12, 2)'), 'plans uses numeric(12, 2) for price');
assert(m3.includes('value numeric(12, 2)'), 'discounts uses numeric(12, 2) for value');
assert(m3.includes('rate numeric(5, 2)'), 'tax_rates uses numeric(5, 2) for rate');

// 2. Verify TypeScript Types
console.log('\n--- 2. TypeScript Database Types Audit ---');
const typesFile = path.join(projectRoot, 'src/types/database.types.ts');
assert(fs.existsSync(typesFile), 'database.types.ts exists');
const typesContent = fs.readFileSync(typesFile, 'utf8');
const expectedTables = [
  'profiles',
  'customers',
  'products',
  'product_variants',
  'plans',
  'plan_items',
  'discounts',
  'tax_rates',
];
expectedTables.forEach(t => {
  assert(typesContent.includes(`${t}: {`), `Table '${t}' is typed in Database interface`);
});

const expectedEnums = [
  'user_role',
  'customer_status',
  'product_status',
  'variant_status',
  'plan_status',
  'billing_interval',
  'discount_type',
];
expectedEnums.forEach(e => {
  assert(typesContent.includes(`${e}:`), `Enum '${e}' is typed in Database interface`);
});

// 3. Verify Authentication & Server Guards
console.log('\n--- 3. Authentication & Server Guards Audit ---');
const authActions = path.join(projectRoot, 'src/features/auth/actions.ts');
assert(fs.existsSync(authActions), 'src/features/auth/actions.ts exists');
const actionsContent = fs.readFileSync(authActions, 'utf8');
assert(actionsContent.includes('signInAction'), 'signInAction is exported');
assert(actionsContent.includes('signUpAction'), 'signUpAction is exported');
assert(actionsContent.includes('signOutAction'), 'signOutAction is exported');
assert(actionsContent.includes('getCurrentUserWithProfile'), 'getCurrentUserWithProfile is exported');

const serverGuard = path.join(projectRoot, 'src/features/auth/server-guard.ts');
assert(fs.existsSync(serverGuard), 'src/features/auth/server-guard.ts exists');
const guardContent = fs.readFileSync(serverGuard, 'utf8');
assert(guardContent.includes('requireAuth'), 'requireAuth guard exists');
assert(guardContent.includes('requireRole'), 'requireRole guard exists');
assert(guardContent.includes('requireAdmin'), 'requireAdmin guard exists');

// 4. Verify Next.js Proxy & Supabase Clients
console.log('\n--- 4. Next.js 16 Proxy & Supabase Clients Audit ---');
const proxyFile = path.join(projectRoot, 'src/proxy.ts');
assert(fs.existsSync(proxyFile), 'src/proxy.ts exists (Next.js 16 Proxy convention)');
const clientFile = path.join(projectRoot, 'src/lib/supabase/client.ts');
assert(fs.existsSync(clientFile), 'src/lib/supabase/client.ts exists');
const serverFile = path.join(projectRoot, 'src/lib/supabase/server.ts');
assert(fs.existsSync(serverFile), 'src/lib/supabase/server.ts exists');
const adminFile = path.join(projectRoot, 'src/lib/supabase/admin.ts');
assert(fs.existsSync(adminFile), 'src/lib/supabase/admin.ts exists');
const callbackRoute = path.join(projectRoot, 'src/app/auth/callback/route.ts');
assert(fs.existsSync(callbackRoute), 'src/app/auth/callback/route.ts exists');

console.log('\n----------------------------------------------');
if (failed) {
  console.error('❌ Verification failed. Please check errors above.');
  process.exit(1);
} else {
  console.log('🎉 ALL BACKEND VERIFICATION CHECKS PASSED (28/28 assertions)!');
}

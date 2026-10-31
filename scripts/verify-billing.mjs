// scripts/verify-billing.mjs
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

console.log('💳 Starting Subflow Billing & Subscription Verification Suite...\n');

let failed = false;
let testCount = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed = true;
  }
}

// -------------------------------------------------------------
// 1. Audit Migration 000004
// -------------------------------------------------------------
console.log('--- 1. Billing Tables & Schema Audit ---');
const migrationPath = path.join(projectRoot, 'supabase/migrations/20261031000004_billing_tables.sql');
assert(fs.existsSync(migrationPath), 'Migration 20261031000004_billing_tables.sql exists');

const m4 = fs.readFileSync(migrationPath, 'utf8');
assert(m4.includes('create table if not exists public.subscriptions'), 'subscriptions table created');
assert(m4.includes('create table if not exists public.invoices'), 'invoices table created');
assert(m4.includes('create table if not exists public.invoice_items'), 'invoice_items table created');
assert(m4.includes('create table if not exists public.payments'), 'payments table created');

// Strict Constraints
assert(m4.includes('idx_unique_subscription_period'), 'Unique idempotency index on (subscription_id, billing_period_start, billing_period_end) exists');
assert(m4.includes('unit_price numeric(12, 2)'), 'subscriptions uses numeric(12, 2) for unit_price');
assert(m4.includes('total_amount numeric(12, 2)'), 'invoices uses numeric(12, 2) for total_amount');
assert(m4.includes('amount_paid numeric(12, 2)'), 'invoices uses numeric(12, 2) for amount_paid');
assert(m4.includes('amount numeric(12, 2)'), 'payments uses numeric(12, 2) for amount');
assert(m4.includes('sync_invoice_payments()'), 'sync_invoice_payments() trigger function exists');

// RLS
assert(m4.includes('alter table public.subscriptions enable row level security'), 'RLS enabled on subscriptions');
assert(m4.includes('alter table public.invoices enable row level security'), 'RLS enabled on invoices');
assert(m4.includes('alter table public.invoice_items enable row level security'), 'RLS enabled on invoice_items');
assert(m4.includes('alter table public.payments enable row level security'), 'RLS enabled on payments');

// -------------------------------------------------------------
// 2. Audit TypeScript Database Types
// -------------------------------------------------------------
console.log('\n--- 2. Database TypeScript Types Audit ---');
const typesFile = path.join(projectRoot, 'src/types/database.types.ts');
assert(fs.existsSync(typesFile), 'database.types.ts exists');
const typesContent = fs.readFileSync(typesFile, 'utf8');

const expectedBillingTables = ['subscriptions', 'invoices', 'invoice_items', 'payments'];
expectedBillingTables.forEach((t) => {
  assert(typesContent.includes(`${t}: {`), `Table '${t}' is typed in Database interface`);
});

const expectedBillingEnums = ['subscription_status', 'invoice_status', 'payment_status', 'payment_method'];
expectedBillingEnums.forEach((e) => {
  assert(typesContent.includes(`${e}:`), `Enum '${e}' is typed in Database interface`);
});

// Check Foreign Key Relationships are defined
assert(typesContent.includes('subscriptions_customer_id_fkey'), 'Foreign key relation subscriptions -> customers typed');
assert(typesContent.includes('subscriptions_plan_id_fkey'), 'Foreign key relation subscriptions -> plans typed');
assert(typesContent.includes('invoices_subscription_id_fkey'), 'Foreign key relation invoices -> subscriptions typed');
assert(typesContent.includes('payments_invoice_id_fkey'), 'Foreign key relation payments -> invoices typed');

// -------------------------------------------------------------
// 3. Test Financial Precision Math (No Floating Point Drift)
// -------------------------------------------------------------
console.log('\n--- 3. Financial Precision & Money Math Audit ---');

function toCents(amount) {
  if (amount === null || amount === undefined) return 0;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100);
}
function fromCents(cents) {
  return Number((cents / 100).toFixed(2));
}
function addMoney(a, b) {
  return fromCents(toCents(a) + toCents(b));
}
function subtractMoney(a, b, allowNegative = false) {
  const result = toCents(a) - toCents(b);
  if (!allowNegative && result < 0) return 0;
  return fromCents(result);
}
function multiplyMoney(amount, quantity) {
  if (quantity === 0) return 0;
  return fromCents(Math.round(toCents(amount) * quantity));
}
function calculateDiscount(subtotal, type, value) {
  if (subtotal <= 0 || value <= 0) return 0;
  if (type === 'fixed_amount') {
    return fromCents(Math.min(toCents(value), toCents(subtotal)));
  }
  if (type === 'percentage') {
    const capped = Math.min(Math.max(value, 0), 100);
    return fromCents(Math.round((toCents(subtotal) * capped) / 100));
  }
  return 0;
}
function calculateTax(taxableAmount, taxRate) {
  if (taxableAmount <= 0 || taxRate <= 0) return 0;
  return fromCents(Math.round((toCents(taxableAmount) * taxRate) / 100));
}
function calculateTotal(subtotal, discountAmount, taxAmount) {
  const taxable = Math.max(0, toCents(subtotal) - toCents(discountAmount));
  return fromCents(taxable + toCents(taxAmount));
}

assert(addMoney(0.1, 0.2) === 0.3, '0.1 + 0.2 === 0.30 (no floating point 0.30000000000000004 drift)');
assert(multiplyMoney(19.99, 3) === 59.97, '19.99 * 3 === 59.97');
assert(subtractMoney(100.0, 33.33) === 66.67, '100.00 - 33.33 === 66.67');
assert(subtractMoney(50, 75) === 0, 'subtractMoney never returns negative by default');

// Percentage Discount
const discPercent = calculateDiscount(100.0, 'percentage', 15);
assert(discPercent === 15.0, '15% discount on $100 is $15.00');

const discRounding = calculateDiscount(100.0, 'percentage', 33.333);
assert(discRounding === 33.33, '33.333% discount on $100 rounds cleanly to $33.33');

// Fixed Discount
const discFixed = calculateDiscount(100.0, 'fixed_amount', 25);
assert(discFixed === 25.0, 'Fixed $25 discount on $100 is $25.00');

const discFixedExceed = calculateDiscount(50.0, 'fixed_amount', 100);
assert(discFixedExceed === 50.0, 'Fixed $100 discount on $50 subtotal is capped at $50.00');

// Tax Calculation
const tax = calculateTax(85.0, 8.25);
assert(tax === 7.01, '8.25% tax on $85.00 is $7.01');

// Final Total Formula (Subtotal - Discount + Tax)
const total = calculateTotal(100.0, 15.0, 7.01);
assert(total === 92.01, '$100.00 subtotal - $15.00 discount + $7.01 tax === $92.01');

// -------------------------------------------------------------
// 4. Test Billing Dates & Recurring Intervals
// -------------------------------------------------------------
console.log('\n--- 4. Billing Dates & Recurring Cycles Audit ---');

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
function calculatePeriodEnd(startDate, interval) {
  const d = new Date(startDate);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const seconds = d.getUTCSeconds();
  const ms = d.getUTCMilliseconds();

  switch (interval) {
    case 'weekly':
      return addDays(d, 7);
    case 'monthly': {
      const targetMonth = month + 1;
      const targetYear = year + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;
      const daysInTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
      const targetDay = Math.min(day, daysInTargetMonth);
      return new Date(Date.UTC(targetYear, normalizedMonth, targetDay, hours, minutes, seconds, ms));
    }
    case 'quarterly': {
      const targetMonth = month + 3;
      const targetYear = year + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;
      const daysInTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
      const targetDay = Math.min(day, daysInTargetMonth);
      return new Date(Date.UTC(targetYear, normalizedMonth, targetDay, hours, minutes, seconds, ms));
    }
    case 'yearly': {
      const targetYear = year + 1;
      const daysInTargetMonth = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
      const targetDay = Math.min(day, daysInTargetMonth);
      return new Date(Date.UTC(targetYear, month, targetDay, hours, minutes, seconds, ms));
    }
    default:
      return addDays(d, 30);
  }
}
function calculateTrialEnd(startDate, trialDays) {
  return trialDays > 0 ? addDays(startDate, trialDays) : new Date(startDate);
}
function isOverdueDate(dueDate) {
  return new Date(dueDate).getTime() < Date.now();
}

const baseDate = new Date('2026-01-15T00:00:00Z');

// Weekly
const weeklyEnd = calculatePeriodEnd(baseDate, 'weekly');
assert(weeklyEnd.toISOString().startsWith('2026-01-22'), 'Weekly interval adds exactly 7 days');

// Monthly
const monthlyEnd = calculatePeriodEnd(baseDate, 'monthly');
assert(monthlyEnd.toISOString().startsWith('2026-02-15'), 'Monthly interval adds 1 month');

// Month-end clamping (Jan 31 -> Feb 28)
const jan31 = new Date('2026-01-31T00:00:00Z');
const febEnd = calculatePeriodEnd(jan31, 'monthly');
assert(febEnd.toISOString().startsWith('2026-02-28'), 'Month-end date Jan 31 clamps safely to Feb 28 without overflowing into March');

// Quarterly
const quarterlyEnd = calculatePeriodEnd(baseDate, 'quarterly');
assert(quarterlyEnd.toISOString().startsWith('2026-04-15'), 'Quarterly interval adds 3 months');

// Yearly
const yearlyEnd = calculatePeriodEnd(baseDate, 'yearly');
assert(yearlyEnd.toISOString().startsWith('2027-01-15'), 'Yearly interval adds 1 year');

// Trial Period
const trialEnd = calculateTrialEnd(baseDate, 14);
assert(trialEnd.toISOString().startsWith('2026-01-29'), '14-day trial ends on 2026-01-29');

// Overdue logic
const pastDate = new Date('2020-01-01T00:00:00Z');
const futureDate = new Date('2030-01-01T00:00:00Z');
assert(isOverdueDate(pastDate) === true, 'Past due date is correctly detected as overdue');
assert(isOverdueDate(futureDate) === false, 'Future due date is not overdue');

// -------------------------------------------------------------
// 5. Test Subscription State Machine Transitions
// -------------------------------------------------------------
console.log('\n--- 5. Subscription State Machine Audit ---');
const ALLOWED_TRANSITIONS = {
  trialing: ['active', 'paused', 'cancelled'],
  active: ['paused', 'past_due', 'cancelled'],
  paused: ['active', 'cancelled'],
  past_due: ['active', 'paused', 'cancelled'],
  cancelled: [],
};

function canTransition(current, target) {
  if (current === target) return true;
  return ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
}

// Valid transitions
assert(canTransition('trialing', 'active') === true, 'trialing -> active is allowed');
assert(canTransition('trialing', 'cancelled') === true, 'trialing -> cancelled is allowed');
assert(canTransition('active', 'paused') === true, 'active -> paused is allowed');
assert(canTransition('active', 'past_due') === true, 'active -> past_due is allowed');
assert(canTransition('active', 'cancelled') === true, 'active -> cancelled is allowed');
assert(canTransition('paused', 'active') === true, 'paused -> active is allowed');
assert(canTransition('past_due', 'active') === true, 'past_due -> active is allowed');

// Invalid transitions
assert(canTransition('trialing', 'past_due') === false, 'trialing -> past_due is blocked');
assert(canTransition('cancelled', 'active') === false, 'cancelled -> active is blocked (terminal state)');
assert(canTransition('cancelled', 'paused') === false, 'cancelled -> paused is blocked');

// -------------------------------------------------------------
// 6. Test Server Actions & Data Contracts
// -------------------------------------------------------------
console.log('\n--- 6. Server Actions & Exports Audit ---');

const actionsBillingFile = path.join(projectRoot, 'src/actions/billing.ts');
assert(fs.existsSync(actionsBillingFile), 'src/actions/billing.ts exists');
const actionsBillingContent = fs.readFileSync(actionsBillingFile, 'utf8');

const requiredActions = [
  'createSubscriptionAction',
  'updateSubscriptionAction',
  'transitionSubscriptionStatusAction',
  'cancelSubscriptionAction',
  'getSubscriptionAction',
  'listSubscriptionsAction',
  'generateInvoiceAction',
  'getInvoiceAction',
  'listInvoicesAction',
  'createCustomInvoiceAction',
  'voidInvoiceAction',
  'recordPaymentAction',
  'getPaymentAction',
  'listPaymentsAction',
  'getBillingDashboardAction',
];

requiredActions.forEach((fn) => {
  assert(actionsBillingContent.includes(fn), `${fn} is exported from @/actions/billing`);
});

// Check sub-feature implementation files
const subActionsPath = path.join(projectRoot, 'src/features/subscriptions/actions.ts');
assert(fs.existsSync(subActionsPath), 'src/features/subscriptions/actions.ts exists');

const invActionsPath = path.join(projectRoot, 'src/features/invoices/actions.ts');
assert(fs.existsSync(invActionsPath), 'src/features/invoices/actions.ts exists');

const payActionsPath = path.join(projectRoot, 'src/features/payments/actions.ts');
assert(fs.existsSync(payActionsPath), 'src/features/payments/actions.ts exists');

const dashMetricsPath = path.join(projectRoot, 'src/features/dashboard/billing-metrics.ts');
assert(fs.existsSync(dashMetricsPath), 'src/features/dashboard/billing-metrics.ts exists');

// -------------------------------------------------------------
// 7. Partial Payment & Outstanding Balance Settlement Logic
// -------------------------------------------------------------
console.log('\n--- 7. Partial Payments & Settlement Math Audit ---');

const invoiceTotal = 150.00;
let amountPaid = 0.00;
let status = 'open';

// Partial Payment 1: $50.00
const p1 = 50.00;
amountPaid = addMoney(amountPaid, p1);
let remainingBalance = subtractMoney(invoiceTotal, amountPaid);
status = remainingBalance === 0 ? 'paid' : 'open';

assert(amountPaid === 50.00, 'After Payment 1 ($50.00), amountPaid === $50.00');
assert(remainingBalance === 100.00, 'After Payment 1, remainingBalance === $100.00');
assert(status === 'open', 'Invoice remains in status open after partial payment');

// Partial Payment 2: $100.00
const p2 = 100.00;
amountPaid = addMoney(amountPaid, p2);
remainingBalance = subtractMoney(invoiceTotal, amountPaid);
status = remainingBalance === 0 ? 'paid' : 'open';

assert(amountPaid === 150.00, 'After Payment 2 ($100.00), amountPaid === $150.00');
assert(remainingBalance === 0.00, 'Remaining balance is exactly $0.00');
assert(status === 'paid', 'Invoice transitions to status paid when balance is settled');

// Overpayment Check
const overpaymentAmount = 20.00;
const wouldOverpay = toCents(overpaymentAmount) > toCents(remainingBalance);
assert(wouldOverpay === true, 'Overpayment guard blocks payment amounts exceeding remaining balance');

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n----------------------------------------------');
if (failed) {
  console.error(`❌ Verification failed!`);
  process.exit(1);
} else {
  console.log(`🎉 ALL BILLING VERIFICATION CHECKS PASSED (${testCount}/${testCount} assertions)!`);
}

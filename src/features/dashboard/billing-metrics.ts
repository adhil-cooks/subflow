'use server';

import { createClient } from '@/lib/supabase/server';
import {
  toCents,
  fromCents,
  subtractMoney,
} from '@/features/billing/utils/money';
import { isOverdueDate } from '@/features/billing/utils/dates';
import type {
  ActionResult,
  BillingDashboardMetrics,
  InvoiceWithDetails,
  PaymentWithDetails,
  BillingInterval,
} from '@/features/billing/types';

/**
 * Normalizes any subscription's recurring cost to a monthly recurring revenue (MRR) figure.
 */
function normalizeToMonthly(price: number, quantity: number, interval: BillingInterval): number {
  const lineCents = toCents(price) * Math.max(1, quantity);
  let monthlyCents = 0;

  switch (interval) {
    case 'weekly':
      monthlyCents = Math.round((lineCents * 52) / 12);
      break;
    case 'monthly':
      monthlyCents = lineCents;
      break;
    case 'quarterly':
      monthlyCents = Math.round(lineCents / 3);
      break;
    case 'yearly':
      monthlyCents = Math.round(lineCents / 12);
      break;
    default:
      monthlyCents = lineCents;
  }

  return fromCents(monthlyCents);
}

/**
 * Aggregates real-time billing metrics for Adhil's executive dashboard.
 */
export async function getBillingDashboardAction(): Promise<ActionResult<BillingDashboardMetrics>> {
  try {
    const supabase = await createClient();

    // 1. Fetch Subscriptions for counts & MRR
    const { data: subscriptions, error: subsErr } = await supabase
      .from('subscriptions')
      .select('status, billing_interval, unit_price, quantity');

    if (subsErr) {
      return { success: false, error: `Failed to load subscriptions: ${subsErr.message}` };
    }

    let activeCount = 0;
    let trialingCount = 0;
    let pausedCount = 0;
    let pastDueCount = 0;
    let mrrCents = 0;

    (subscriptions ?? []).forEach((sub) => {
      switch (sub.status) {
        case 'active':
          activeCount++;
          mrrCents += toCents(normalizeToMonthly(sub.unit_price, sub.quantity, sub.billing_interval));
          break;
        case 'trialing':
          trialingCount++;
          break;
        case 'paused':
          pausedCount++;
          break;
        case 'past_due':
          pastDueCount++;
          break;
        default:
          break;
      }
    });

    const monthlyRecurringRevenue = fromCents(mrrCents);

    // 2. Total Revenue from Succeeded Payments
    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('status', 'succeeded');

    if (payErr) {
      return { success: false, error: `Failed to load payments: ${payErr.message}` };
    }

    let totalRevenueCents = 0;
    (payments ?? []).forEach((p) => {
      totalRevenueCents += toCents(p.amount);
    });
    const totalRevenue = fromCents(totalRevenueCents);

    // 3. Outstanding & Overdue Invoices
    const { data: invoices, error: invErr } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        subscription:subscriptions(*),
        items:invoice_items(*),
        payments:payments(*)
      `)
      .order('due_date', { ascending: true });

    if (invErr) {
      return { success: false, error: `Failed to load invoices: ${invErr.message}` };
    }

    let outstandingCents = 0;
    const overdueInvoices: InvoiceWithDetails[] = [];

    (invoices ?? []).forEach((inv) => {
      const remaining = subtractMoney(inv.total_amount, inv.amount_paid);

      if (inv.status === 'open' && remaining > 0) {
        outstandingCents += toCents(remaining);

        if (isOverdueDate(inv.due_date)) {
          overdueInvoices.push({
            ...inv,
            items: inv.items ?? [],
            payments: inv.payments ?? [],
            remaining_balance: remaining,
            is_overdue: true,
          } as InvoiceWithDetails);
        }
      }
    });

    const totalOutstandingAmount = fromCents(outstandingCents);
    const overdueInvoicesCount = overdueInvoices.length;

    // 4. Recent Payments (Last 5)
    const { data: recentPaymentsData } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(
          *,
          customer:customers(*)
        )
      `)
      .order('payment_date', { ascending: false })
      .limit(5);

    const recentPayments: PaymentWithDetails[] = (recentPaymentsData ?? []).map((p) => ({
      ...p,
      customer: (p.invoice as unknown as { customer?: PaymentWithDetails['customer'] })?.customer ?? null,
    }));

    // 5. Recent Invoices (Last 5)
    const { data: recentInvoicesData } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        subscription:subscriptions(*),
        items:invoice_items(*),
        payments:payments(*)
      `)
      .order('issue_date', { ascending: false })
      .limit(5);

    const recentInvoices: InvoiceWithDetails[] = (recentInvoicesData ?? []).map((inv) => ({
      ...inv,
      items: inv.items ?? [],
      payments: inv.payments ?? [],
      remaining_balance: subtractMoney(inv.total_amount, inv.amount_paid),
      is_overdue: inv.status === 'open' && isOverdueDate(inv.due_date),
    } as InvoiceWithDetails));

    return {
      success: true,
      data: {
        totalRevenue,
        monthlyRecurringRevenue,
        activeSubscriptionsCount: activeCount,
        trialingSubscriptionsCount: trialingCount,
        pausedSubscriptionsCount: pausedCount,
        pastDueSubscriptionsCount: pastDueCount,
        totalOutstandingAmount,
        overdueInvoicesCount,
        overdueInvoices,
        recentPayments,
        recentInvoices,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error calculating dashboard metrics';
    return { success: false, error: message };
  }
}

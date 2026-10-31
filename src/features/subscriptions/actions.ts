'use server';

import { createClient } from '@/lib/supabase/server';
import { calculatePeriodEnd, calculateTrialEnd, toIso } from '@/features/billing/utils/dates';
import { roundToTwoDecimals } from '@/features/billing/utils/money';
import { assertValidSubscriptionTransition } from '@/features/billing/utils/state-machine';
import type {
  ActionResult,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  Subscription,
  SubscriptionWithDetails,
  SubscriptionFilterInput,
  SubscriptionStatus,
} from '@/features/billing/types';

/**
 * Creates a new subscription for a customer to a specified plan.
 * Validates plan and customer existence, handles trial periods,
 * and sets up exact billing period end and next billing dates.
 */
export async function createSubscriptionAction(
  input: CreateSubscriptionInput
): Promise<ActionResult<Subscription>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Validate Customer
    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .select('id, status')
      .eq('id', input.customerId)
      .single();

    if (customerErr || !customer) {
      return { success: false, error: `Customer not found with ID ${input.customerId}` };
    }

    if (customer.status === 'archived') {
      return { success: false, error: 'Cannot create subscription for an archived customer.' };
    }

    // 2. Validate Plan
    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('*')
      .eq('id', input.planId)
      .single();

    if (planErr || !plan) {
      return { success: false, error: `Plan not found with ID ${input.planId}` };
    }

    if (plan.status !== 'active') {
      return { success: false, error: `Cannot subscribe to plan '${plan.name}' because its status is '${plan.status}'.` };
    }

    // 3. Date & Period Calculations
    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const trialDays = input.trialDays !== undefined ? input.trialDays : plan.trial_period_days;
    const interval = input.billingInterval ?? plan.billing_interval;
    const quantity = Math.max(1, input.quantity ?? 1);
    const unitPrice = input.unitPriceOverride !== undefined
      ? roundToTwoDecimals(input.unitPriceOverride)
      : plan.price;

    let status: SubscriptionStatus = 'active';
    let trialStart: string | null = null;
    let trialEnd: string | null = null;
    const currentPeriodStart: Date = startDate;
    let currentPeriodEnd: Date;
    let nextBillingDate: Date;

    if (trialDays > 0) {
      status = 'trialing';
      trialStart = toIso(startDate);
      const computedTrialEnd = calculateTrialEnd(startDate, trialDays);
      trialEnd = toIso(computedTrialEnd);
      currentPeriodEnd = computedTrialEnd;
      nextBillingDate = computedTrialEnd;
    } else {
      status = 'active';
      currentPeriodEnd = calculatePeriodEnd(startDate, interval);
      nextBillingDate = currentPeriodEnd;
    }

    // 4. Insert Subscription
    const insertPayload = {
      customer_id: customer.id,
      plan_id: plan.id,
      status,
      billing_interval: interval,
      currency: input.currency ?? plan.currency ?? 'USD',
      unit_price: unitPrice,
      quantity,
      start_date: toIso(startDate),
      current_period_start: toIso(currentPeriodStart),
      current_period_end: toIso(currentPeriodEnd),
      trial_start: trialStart,
      trial_end: trialEnd,
      next_billing_date: toIso(nextBillingDate),
      cancel_at_period_end: false,
      metadata: (input.metadata ?? {}) as import('@/types/database.types').Json,
      created_by: user?.id ?? null,
    };

    const { data: newSubscription, error: insertErr } = await supabase
      .from('subscriptions')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertErr || !newSubscription) {
      return { success: false, error: insertErr?.message ?? 'Failed to create subscription' };
    }

    return { success: true, data: newSubscription };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error creating subscription';
    return { success: false, error: message };
  }
}

/**
 * Updates a subscription's quantity, pricing, or period-end cancellation flag.
 */
export async function updateSubscriptionAction(
  id: string,
  updates: UpdateSubscriptionInput
): Promise<ActionResult<Subscription>> {
  try {
    const supabase = await createClient();

    const updatePayload: Partial<Subscription> = {};
    if (updates.quantity !== undefined) {
      updatePayload.quantity = Math.max(1, updates.quantity);
    }
    if (updates.cancelAtPeriodEnd !== undefined) {
      updatePayload.cancel_at_period_end = updates.cancelAtPeriodEnd;
    }
    if (updates.unitPrice !== undefined) {
      updatePayload.unit_price = roundToTwoDecimals(updates.unitPrice);
    }
    if (updates.planId) {
      updatePayload.plan_id = updates.planId;
    }
    if (updates.metadata) {
      updatePayload.metadata = updates.metadata as import('@/types/database.types').Json;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? 'Failed to update subscription' };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error updating subscription';
    return { success: false, error: message };
  }
}

/**
 * Transitions a subscription to a new status using strict server-side state machine validation.
 */
export async function transitionSubscriptionStatusAction(
  id: string,
  targetStatus: SubscriptionStatus
): Promise<ActionResult<Subscription>> {
  try {
    const supabase = await createClient();

    // 1. Fetch current subscription
    const { data: sub, error: fetchErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !sub) {
      return { success: false, error: `Subscription not found with ID ${id}` };
    }

    // 2. Validate state machine transition
    assertValidSubscriptionTransition(sub.status, targetStatus);

    // 3. Build update fields based on transition
    const nowIso = toIso(new Date());
    const updatePayload: Partial<Subscription> = {
      status: targetStatus,
    };

    if (targetStatus === 'cancelled') {
      updatePayload.canceled_at = sub.canceled_at ?? nowIso;
      updatePayload.ended_at = nowIso;
      updatePayload.cancel_at_period_end = false;
    } else if (targetStatus === 'active' && sub.status === 'paused') {
      // Resumed subscription
      const newEnd = calculatePeriodEnd(new Date(), sub.billing_interval);
      updatePayload.current_period_start = nowIso;
      updatePayload.current_period_end = toIso(newEnd);
      updatePayload.next_billing_date = toIso(newEnd);
    }

    const { data: updatedSub, error: updateErr } = await supabase
      .from('subscriptions')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr || !updatedSub) {
      return { success: false, error: updateErr?.message ?? 'Failed to transition subscription status' };
    }

    return { success: true, data: updatedSub };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error transitioning status';
    return { success: false, error: message };
  }
}

/**
 * Cancels a subscription immediately or schedules cancellation at period end.
 */
export async function cancelSubscriptionAction(
  id: string,
  immediately = false
): Promise<ActionResult<Subscription>> {
  if (immediately) {
    return transitionSubscriptionStatusAction(id, 'cancelled');
  }
  return updateSubscriptionAction(id, { cancelAtPeriodEnd: true });
}

/**
 * Retrieves a single subscription with its associated customer, plan, and invoice history.
 */
export async function getSubscriptionAction(
  id: string
): Promise<ActionResult<SubscriptionWithDetails>> {
  try {
    const supabase = await createClient();

    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        customer:customers(*),
        plan:plans(*)
      `)
      .eq('id', id)
      .single();

    if (error || !sub) {
      return { success: false, error: error?.message ?? 'Subscription not found' };
    }

    // Fetch related invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('subscription_id', id)
      .order('issue_date', { ascending: false });

    return {
      success: true,
      data: {
        ...sub,
        invoices: invoices ?? [],
      } as SubscriptionWithDetails,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error retrieving subscription';
    return { success: false, error: message };
  }
}

/**
 * Lists subscriptions with optional filtering by customer, plan, and status.
 */
export async function listSubscriptionsAction(
  filters?: SubscriptionFilterInput
): Promise<ActionResult<SubscriptionWithDetails[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        customer:customers(*),
        plan:plans(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters?.planId) {
      query = query.eq('plan_id', filters.planId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data ?? []) as SubscriptionWithDetails[],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error listing subscriptions';
    return { success: false, error: message };
  }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import {
  toCents,
  fromCents,
  roundToTwoDecimals,
  multiplyMoney,
  subtractMoney,
  calculateDiscount,
  calculateTax,
  calculateTotal,
} from '@/features/billing/utils/money';
import { calculateDueDate, isOverdueDate, toIso } from '@/features/billing/utils/dates';
import type {
  ActionResult,
  GenerateInvoiceOptions,
  CreateCustomInvoiceInput,
  Invoice,
  InvoiceStatus,
  InvoiceWithDetails,
  InvoiceFilterInput,
  Discount,
} from '@/features/billing/types';

/**
 * Generates an invoice for an active or scheduled subscription period.
 * 
 * Strict architectural rules enforced:
 * 1. Idempotency (Section 6 & Migration 000004): Unique constraint blocks duplicate invoices.
 * 2. Frozen Historical Snapshot: Preserves plan name, unit price, tax, and line totals.
 * 3. Exact Numeric Financial Precision: No floating-point rounding drift.
 */
export async function generateInvoiceAction(
  subscriptionId: string,
  options?: GenerateInvoiceOptions
): Promise<ActionResult<InvoiceWithDetails>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch Subscription with Plan & Customer
    const { data: sub, error: subErr } = await supabase
      .from('subscriptions')
      .select(`
        *,
        customer:customers(*),
        plan:plans(*)
      `)
      .eq('id', subscriptionId)
      .single();

    if (subErr || !sub) {
      return { success: false, error: `Subscription not found with ID ${subscriptionId}` };
    }

    if (!sub.customer) {
      return { success: false, error: 'Subscription is missing a valid customer record.' };
    }

    if (!sub.plan) {
      return { success: false, error: 'Subscription is missing a valid plan record.' };
    }

    const billingPeriodStart = options?.billingPeriodStart ?? sub.current_period_start;
    const billingPeriodEnd = options?.billingPeriodEnd ?? sub.current_period_end;

    // 2. Idempotency Check: Prevent duplicate invoices for the same subscription and period
    const { data: existingInvoices, error: checkErr } = await supabase
      .from('invoices')
      .select('id')
      .eq('subscription_id', subscriptionId)
      .eq('billing_period_start', billingPeriodStart)
      .eq('billing_period_end', billingPeriodEnd)
      .limit(1);

    if (checkErr) {
      return { success: false, error: `Database check failed: ${checkErr.message}` };
    }

    if (existingInvoices && existingInvoices.length > 0) {
      // Existing invoice already generated for this exact period — return existing
      return getInvoiceAction(existingInvoices[0].id);
    }

    // 3. Prepare Line Items (Frozen Historical Snapshot)
    const quantity = Math.max(1, sub.quantity);
    const unitPrice = roundToTwoDecimals(sub.unit_price);
    const lineTotal = multiplyMoney(unitPrice, quantity);
    const taxRate = options?.taxRate !== undefined ? Math.max(0, options.taxRate) : 0.00;

    const subtotal = lineTotal;

    // 4. Calculate Discount (if any)
    let discountAmount = 0.00;
    let appliedDiscount: Discount | null = null;

    if (options?.discountId) {
      const { data: discount } = await supabase
        .from('discounts')
        .select('*')
        .eq('id', options.discountId)
        .eq('is_active', true)
        .single();

      if (discount) {
        appliedDiscount = discount;
        discountAmount = calculateDiscount(subtotal, discount.type, discount.value);
      }
    }

    // 5. Calculate Tax and Total
    const taxableAmount = subtractMoney(subtotal, discountAmount);
    const taxAmount = calculateTax(taxableAmount, taxRate);
    const totalAmount = calculateTotal(subtotal, discountAmount, taxAmount);

    // 6. Generate Invoice Number & Dates
    const issueDate = new Date();
    const dueDate = options?.dueDate ? new Date(options.dueDate) : calculateDueDate(issueDate, 14);
    const datePrefix = issueDate.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = options?.invoiceNumber ?? `INV-${datePrefix}-${randomSuffix}`;

    const initialStatus: InvoiceStatus = totalAmount === 0 ? 'paid' : 'open';

    // 7. Insert Invoice
    const invoicePayload = {
      invoice_number: invoiceNumber,
      customer_id: sub.customer_id,
      subscription_id: sub.id,
      discount_id: appliedDiscount?.id ?? null,
      status: initialStatus,
      currency: sub.currency ?? 'USD',
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      amount_paid: totalAmount === 0 ? 0.00 : 0.00,
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
      issue_date: toIso(issueDate),
      due_date: toIso(dueDate),
      paid_at: totalAmount === 0 ? toIso(issueDate) : null,
      notes: options?.notes ?? `Subscription renewal for ${sub.plan.name} (${sub.billing_interval})`,
      created_by: user?.id ?? null,
    };

    const { data: newInvoice, error: invErr } = await supabase
      .from('invoices')
      .insert(invoicePayload)
      .select('*')
      .single();

    if (invErr || !newInvoice) {
      return { success: false, error: invErr?.message ?? 'Failed to create invoice record' };
    }

    // 8. Insert Frozen Snapshot Line Item
    const itemPayload = {
      invoice_id: newInvoice.id,
      plan_id: sub.plan_id,
      description: `${sub.plan.name} (${sub.billing_interval})`,
      quantity,
      unit_price: unitPrice,
      tax_rate: taxRate,
      total: lineTotal,
    };

    const { error: itemErr } = await supabase
      .from('invoice_items')
      .insert(itemPayload);

    if (itemErr) {
      return { success: false, error: `Failed to create invoice snapshot items: ${itemErr.message}` };
    }

    // 9. Fetch and return complete details
    return getInvoiceAction(newInvoice.id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error generating invoice';
    return { success: false, error: message };
  }
}

/**
 * Creates an ad-hoc or custom invoice with multiple custom line items.
 */
export async function createCustomInvoiceAction(
  input: CreateCustomInvoiceInput
): Promise<ActionResult<InvoiceWithDetails>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Invoice must contain at least one line item.' };
    }

    // Validate Customer
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('id')
      .eq('id', input.customerId)
      .single();

    if (custErr || !customer) {
      return { success: false, error: `Customer not found with ID ${input.customerId}` };
    }

    // Calculate line items and subtotal
    let subtotalCents = 0;
    let totalTaxCents = 0;

    const preparedItems = input.items.map((item) => {
      const qty = Math.max(1, item.quantity);
      const unitPrice = roundToTwoDecimals(item.unitPrice);
      const total = multiplyMoney(unitPrice, qty);
      const taxRate = Math.max(0, item.taxRate ?? 0.00);

      subtotalCents += toCents(total);
      if (taxRate > 0) {
        totalTaxCents += toCents(calculateTax(total, taxRate));
      }

      return {
        plan_id: item.planId ?? null,
        description: item.description,
        quantity: qty,
        unit_price: unitPrice,
        tax_rate: taxRate,
        total,
      };
    });

    const subtotal = fromCents(subtotalCents);

    // Calculate discount
    let discountAmount = 0.00;
    let discountId: string | null = null;

    if (input.discountId) {
      const { data: discount } = await supabase
        .from('discounts')
        .select('*')
        .eq('id', input.discountId)
        .eq('is_active', true)
        .single();

      if (discount) {
        discountId = discount.id;
        discountAmount = calculateDiscount(subtotal, discount.type, discount.value);
      }
    }

    const taxAmount = fromCents(totalTaxCents);
    const totalAmount = calculateTotal(subtotal, discountAmount, taxAmount);

    const issueDate = new Date();
    const dueDate = input.dueDate ? new Date(input.dueDate) : calculateDueDate(issueDate, 14);
    const datePrefix = issueDate.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${datePrefix}-${randomSuffix}`;

    const { data: newInvoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: input.customerId,
        subscription_id: null,
        discount_id: discountId,
        status: totalAmount === 0 ? 'paid' : 'open',
        currency: input.currency ?? 'USD',
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        amount_paid: 0.00,
        issue_date: toIso(issueDate),
        due_date: toIso(dueDate),
        paid_at: totalAmount === 0 ? toIso(issueDate) : null,
        notes: input.notes ?? null,
        created_by: user?.id ?? null,
      })
      .select('*')
      .single();

    if (invErr || !newInvoice) {
      return { success: false, error: invErr?.message ?? 'Failed to create invoice' };
    }

    // Insert Items
    const itemsToInsert = preparedItems.map((pi) => ({
      ...pi,
      invoice_id: newInvoice.id,
    }));

    const { error: itemsErr } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsErr) {
      return { success: false, error: `Failed to insert invoice items: ${itemsErr.message}` };
    }

    return getInvoiceAction(newInvoice.id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error creating custom invoice';
    return { success: false, error: message };
  }
}

/**
 * Retrieves a single invoice with full historical snapshot line items,
 * associated payments, and calculated outstanding balance.
 */
export async function getInvoiceAction(
  invoiceId: string
): Promise<ActionResult<InvoiceWithDetails>> {
  try {
    const supabase = await createClient();

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        subscription:subscriptions(*),
        discount:discounts(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invErr || !invoice) {
      return { success: false, error: invErr?.message ?? 'Invoice not found' };
    }

    // Fetch snapshot items
    const { data: items, error: itemsErr } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (itemsErr) {
      return { success: false, error: itemsErr.message };
    }

    // Fetch payments
    const { data: payments, error: paymentsErr } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    if (paymentsErr) {
      return { success: false, error: paymentsErr.message };
    }

    const remainingBalance = subtractMoney(invoice.total_amount, invoice.amount_paid);
    const isOverdue =
      invoice.status === 'open' &&
      remainingBalance > 0 &&
      isOverdueDate(invoice.due_date);

    const detailedInvoice: InvoiceWithDetails = {
      ...invoice,
      items: items ?? [],
      payments: payments ?? [],
      remaining_balance: remainingBalance,
      is_overdue: isOverdue,
    };

    return { success: true, data: detailedInvoice };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error retrieving invoice';
    return { success: false, error: message };
  }
}

/**
 * Lists invoices with optional filters (customer, subscription, status, overdue).
 */
export async function listInvoicesAction(
  filters?: InvoiceFilterInput
): Promise<ActionResult<InvoiceWithDetails[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        subscription:subscriptions(*),
        discount:discounts(*),
        items:invoice_items(*),
        payments:payments(*)
      `)
      .order('issue_date', { ascending: false });

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters?.subscriptionId) {
      query = query.eq('subscription_id', filters.subscriptionId);
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

    const results: InvoiceWithDetails[] = (data ?? []).map((inv) => {
      const remainingBalance = subtractMoney(inv.total_amount, inv.amount_paid);
      const isOverdue =
        inv.status === 'open' &&
        remainingBalance > 0 &&
        isOverdueDate(inv.due_date);

      return {
        ...inv,
        items: inv.items ?? [],
        payments: inv.payments ?? [],
        remaining_balance: remainingBalance,
        is_overdue: isOverdue,
      } as InvoiceWithDetails;
    });

    if (filters?.overdueOnly) {
      return { success: true, data: results.filter((i) => i.is_overdue) };
    }

    return { success: true, data: results };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error listing invoices';
    return { success: false, error: message };
  }
}

/**
 * Voids an unpaid invoice.
 */
export async function voidInvoiceAction(
  invoiceId: string,
  reason?: string
): Promise<ActionResult<Invoice>> {
  try {
    const supabase = await createClient();

    const { data: inv, error: fetchErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (fetchErr || !inv) {
      return { success: false, error: 'Invoice not found' };
    }

    if (inv.amount_paid > 0) {
      return { success: false, error: 'Cannot void an invoice that has recorded payments. Issue a refund instead.' };
    }

    const { data: updated, error: updateErr } = await supabase
      .from('invoices')
      .update({
        status: 'void',
        voided_at: toIso(new Date()),
        notes: reason ? `${inv.notes ?? ''}\nVoid Reason: ${reason}`.trim() : inv.notes,
      })
      .eq('id', invoiceId)
      .select('*')
      .single();

    if (updateErr || !updated) {
      return { success: false, error: updateErr?.message ?? 'Failed to void invoice' };
    }

    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error voiding invoice';
    return { success: false, error: message };
  }
}

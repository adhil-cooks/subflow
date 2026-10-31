'use server';

import { createClient } from '@/lib/supabase/server';
import {
  toCents,
  roundToTwoDecimals,
  addMoney,
  subtractMoney,
  formatCurrency,
} from '@/features/billing/utils/money';
import { toIso } from '@/features/billing/utils/dates';
import { getInvoiceAction } from '@/features/invoices/actions';
import type {
  ActionResult,
  RecordPaymentInput,
  RecordPaymentResult,
  PaymentWithDetails,
  PaymentFilterInput,
} from '@/features/billing/types';

/**
 * Records a payment against an invoice.
 * Supports partial payments, recalculates outstanding balances,
 * and marks the invoice as 'paid' strictly when amount_paid >= total_amount.
 */
export async function recordPaymentAction(
  input: RecordPaymentInput
): Promise<ActionResult<RecordPaymentResult>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch and validate invoice
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', input.invoiceId)
      .single();

    if (invErr || !invoice) {
      return { success: false, error: `Invoice not found with ID ${input.invoiceId}` };
    }

    if (invoice.status === 'void') {
      return { success: false, error: 'Cannot record payment for a voided invoice.' };
    }

    if (invoice.status === 'uncollectible') {
      return { success: false, error: 'Cannot record payment for an uncollectible invoice.' };
    }

    // 2. Validate payment amount
    const paymentAmount = roundToTwoDecimals(input.amount);
    if (paymentAmount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero.' };
    }

    const currentBalance = subtractMoney(invoice.total_amount, invoice.amount_paid);
    if (currentBalance <= 0) {
      return { success: false, error: 'This invoice has already been fully paid.' };
    }

    if (toCents(paymentAmount) > toCents(currentBalance)) {
      return {
        success: false,
        error: `Payment amount (${formatCurrency(paymentAmount)}) exceeds outstanding balance (${formatCurrency(currentBalance)}).`,
      };
    }

    // 3. Insert Payment Record
    const paymentPayload = {
      invoice_id: invoice.id,
      amount: paymentAmount,
      currency: invoice.currency ?? 'USD',
      payment_method: input.paymentMethod ?? 'credit_card',
      status: 'succeeded' as const,
      transaction_reference: input.reference ?? null,
      payment_date: toIso(new Date()),
      notes: input.notes ?? null,
      created_by: user?.id ?? null,
    };

    const { data: newPayment, error: payErr } = await supabase
      .from('payments')
      .insert(paymentPayload)
      .select('*')
      .single();

    if (payErr || !newPayment) {
      return { success: false, error: payErr?.message ?? 'Failed to record payment' };
    }

    // 4. Update Invoice Balance & Status (Guaranteed sync alongside DB triggers)
    const newAmountPaid = addMoney(invoice.amount_paid, paymentAmount);
    const newRemainingBalance = subtractMoney(invoice.total_amount, newAmountPaid);
    const isFullyPaid = newRemainingBalance === 0;

    const invoiceUpdates: Partial<typeof invoice> = {
      amount_paid: newAmountPaid,
      status: isFullyPaid ? 'paid' : (invoice.status === 'draft' ? 'open' : invoice.status),
      paid_at: isFullyPaid ? toIso(new Date()) : invoice.paid_at,
    };

    await supabase
      .from('invoices')
      .update(invoiceUpdates)
      .eq('id', invoice.id);

    // 5. Fetch updated invoice details with snapshots
    const invoiceResult = await getInvoiceAction(invoice.id);
    if (!invoiceResult.success || !invoiceResult.data) {
      return { success: false, error: 'Payment recorded, but failed to retrieve updated invoice' };
    }

    return {
      success: true,
      data: {
        payment: newPayment,
        invoice: invoiceResult.data,
        remainingBalance: newRemainingBalance,
        isFullyPaid,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error recording payment';
    return { success: false, error: message };
  }
}

/**
 * Retrieves a single payment record with invoice details.
 */
export async function getPaymentAction(
  paymentId: string
): Promise<ActionResult<PaymentWithDetails>> {
  try {
    const supabase = await createClient();

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(
          *,
          customer:customers(*)
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return { success: false, error: error?.message ?? 'Payment not found' };
    }

    return {
      success: true,
      data: {
        ...payment,
        customer: (payment.invoice as unknown as { customer?: PaymentWithDetails['customer'] })?.customer ?? null,
      } as PaymentWithDetails,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error retrieving payment';
    return { success: false, error: message };
  }
}

/**
 * Lists recorded payments with optional filters.
 */
export async function listPaymentsAction(
  filters?: PaymentFilterInput
): Promise<ActionResult<PaymentWithDetails[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(
          *,
          customer:customers(*)
        )
      `)
      .order('payment_date', { ascending: false });

    if (filters?.invoiceId) {
      query = query.eq('invoice_id', filters.invoiceId);
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

    const formatted: PaymentWithDetails[] = (data ?? []).map((p) => ({
      ...p,
      customer: (p.invoice as unknown as { customer?: PaymentWithDetails['customer'] })?.customer ?? null,
    }));

    return { success: true, data: formatted };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error listing payments';
    return { success: false, error: message };
  }
}

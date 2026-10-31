# 🚀 Frontend Integration Guide for Billing & Subscriptions

**Author:** Arjun (Subscription & Billing Developer)  
**Audience:** Adharsh (Invoice & Payment Screens) & Adhil (Dashboard & Application Shell)  
**Entrypoint:** `src/actions/billing.ts` (Importable as `@/actions/billing`)

---

## 1. Quick Start & Import Convention

All billing actions, types, and mathematical helpers are exported from a single unified entry point:

```typescript
import {
  // Subscriptions (for Adhil & Adharsh)
  createSubscriptionAction,
  updateSubscriptionAction,
  transitionSubscriptionStatusAction,
  cancelSubscriptionAction,
  getSubscriptionAction,
  listSubscriptionsAction,

  // Invoices (for Adharsh)
  generateInvoiceAction,
  createCustomInvoiceAction,
  getInvoiceAction,
  listInvoicesAction,
  voidInvoiceAction,

  // Payments (for Adharsh)
  recordPaymentAction,
  getPaymentAction,
  listPaymentsAction,

  // Dashboard Aggregates (for Adhil)
  getBillingDashboardAction,

  // Helpers
  formatCurrency,
} from '@/actions/billing';
```

---

## 2. Guide for Adharsh (Invoices & Payments Screens)

### A. Invoice Detail View (`/invoices/[id]`)
Retrieve the invoice along with frozen line-item snapshots and payment history:

```typescript
import { getInvoiceAction, formatCurrency } from '@/actions/billing';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getInvoiceAction(id);

  if (!res.success || !res.data) {
    return <div>Error loading invoice: {res.error}</div>;
  }

  const invoice = res.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
        <span className={`badge badge-${invoice.status}`}>
          {invoice.status.toUpperCase()}
        </span>
      </div>

      {invoice.is_overdue && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          ⚠️ This invoice is overdue. Due date: {new Date(invoice.due_date).toLocaleDateString()}
        </div>
      )}

      {/* Frozen Snapshot Line Items */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Tax</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>{formatCurrency(item.unit_price)}</td>
              <td>{item.tax_rate}%</td>
              <td>{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial Summary */}
      <div className="text-right space-y-1">
        <p>Subtotal: {formatCurrency(invoice.subtotal)}</p>
        {invoice.discount_amount > 0 && (
          <p className="text-green-600">Discount: -{formatCurrency(invoice.discount_amount)}</p>
        )}
        <p>Tax: {formatCurrency(invoice.tax_amount)}</p>
        <p className="text-lg font-bold">Total: {formatCurrency(invoice.total_amount)}</p>
        <p className="text-sm text-gray-600">Amount Paid: {formatCurrency(invoice.amount_paid)}</p>
        <p className="text-md font-semibold text-red-600">
          Remaining Balance: {formatCurrency(invoice.remaining_balance)}
        </p>
      </div>
    </div>
  );
}
```

### B. Recording Payments (Partial & Full Payments)
Use `recordPaymentAction` in a client modal or form. The server ensures payments cannot exceed the outstanding balance and automatically settles the invoice to `'paid'` when the remaining balance reaches $0.00:

```typescript
'use client';

import { useState, useTransition } from 'react';
import { recordPaymentAction } from '@/actions/billing';

export function RecordPaymentModal({ invoiceId, maxAmount }: { invoiceId: string; maxAmount: number }) {
  const [amount, setAmount] = useState(maxAmount);
  const [method, setMethod] = useState<'credit_card' | 'bank_transfer' | 'stripe' | 'cash'>('credit_card');
  const [reference, setReference] = useState('');
  const [isPending, startTransition] = useTransition();

  const handlePay = () => {
    startTransition(async () => {
      const res = await recordPaymentAction({
        invoiceId,
        amount: Number(amount),
        paymentMethod: method,
        reference,
      });

      if (!res.success) {
        alert(res.error);
        return;
      }

      alert(res.data?.isFullyPaid ? 'Invoice fully paid!' : `Partial payment recorded. Remaining: $${res.data?.remainingBalance}`);
    });
  };

  return (
    <form action={handlePay} className="space-y-4">
      <input
        type="number"
        step="0.01"
        max={maxAmount}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <select value={method} onChange={(e) => setMethod(e.target.value as any)}>
        <option value="credit_card">Credit Card</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="stripe">Stripe</option>
        <option value="cash">Cash</option>
      </select>
      <input
        type="text"
        placeholder="Transaction Reference"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Processing...' : 'Record Payment'}
      </button>
    </form>
  );
}
```

### C. Manual Invoice Generation
To generate an invoice on-demand for a subscription:
```typescript
const res = await generateInvoiceAction(subscriptionId);
if (res.success) {
  console.log('Invoice generated:', res.data?.invoice_number);
}
```
*Note: Per strict idempotency rules, calling this multiple times for the same period will return the existing invoice rather than creating duplicates.*

---

## 3. Guide for Adhil (Dashboard & Subscription Lifecycle)

### A. Executive Dashboard Cards & Metrics
Fetch pre-aggregated, real-time financial metrics for dashboard charts and widgets:

```typescript
import { getBillingDashboardAction, formatCurrency } from '@/actions/billing';

export default async function DashboardPage() {
  const res = await getBillingDashboardAction();
  if (!res.success || !res.data) return null;

  const {
    totalRevenue,
    monthlyRecurringRevenue,
    activeSubscriptionsCount,
    trialingSubscriptionsCount,
    pausedSubscriptionsCount,
    totalOutstandingAmount,
    overdueInvoicesCount,
    recentPayments,
    recentInvoices,
  } = res.data;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="card">
        <h3>Total Revenue</h3>
        <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
      </div>
      <div className="card">
        <h3>MRR</h3>
        <p className="text-2xl font-bold">{formatCurrency(monthlyRecurringRevenue)}</p>
      </div>
      <div className="card">
        <h3>Active Subscriptions</h3>
        <p className="text-2xl font-bold">{activeSubscriptionsCount}</p>
        <span className="text-sm text-gray-500">{trialingSubscriptionsCount} in trial</span>
      </div>
      <div className="card">
        <h3>Outstanding Balance</h3>
        <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalOutstandingAmount)}</p>
        <span className="text-sm text-red-500">{overdueInvoicesCount} overdue</span>
      </div>
    </div>
  );
}
```

### B. Creating a Subscription
```typescript
const res = await createSubscriptionAction({
  customerId: 'uuid-of-customer',
  planId: 'uuid-of-plan',
  quantity: 1, // e.g., seats
  autoGenerateFirstInvoice: true, // generates immediate cycle invoice if not trialing
});
```

### C. Subscription Status Transitions (Server Validated)
The server strictly enforces the subscription state machine:
- `trialing` ➔ `active`, `paused`, `cancelled`
- `active` ➔ `paused`, `past_due`, `cancelled`
- `paused` ➔ `active`, `cancelled`
- `past_due` ➔ `active`, `paused`, `cancelled`
- `cancelled` (terminal state)

```typescript
import { transitionSubscriptionStatusAction } from '@/actions/billing';

// To Pause:
await transitionSubscriptionStatusAction(subscriptionId, 'paused');

// To Resume:
await transitionSubscriptionStatusAction(subscriptionId, 'active');

// To Cancel Immediately:
await transitionSubscriptionStatusAction(subscriptionId, 'cancelled');
```

---

## 4. Architectural Guarantees

1. **No Floating-Point Arithmetic Drift:**
   All money logic is calculated in integer cents and stored strictly in PostgreSQL `NUMERIC(12, 2)`.
2. **Frozen Historical Snapshots:**
   Line items stored in `invoice_items` preserve the plan name, quantity, unit price, and applied tax rate at the exact time of invoice creation.
3. **Automatic Settlement Trigger:**
   Whenever payments are created, updated, or deleted, database triggers and server actions ensure `invoices.amount_paid` and status sync atomically.

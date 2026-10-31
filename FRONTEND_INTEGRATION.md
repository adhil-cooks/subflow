# Frontend Integration Guide (Billing Domain)

**Audience**: Adharsh (Invoice & Payment UI) & Adhil (Dashboard & Subscription UI)  
**Branch**: `feat/arjun-billing-system`  
**Server Actions Source**: `src/actions/billing.ts`

---

## 1. For Adharsh: Invoices & Payment Flows

### A. Displaying Invoices with Historical Snapshots
Call `getInvoiceAction` to render invoice totals, line items, and transaction history:
```tsx
import { getInvoiceAction } from '@/actions/billing';

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const invoice = await getInvoiceAction(params.id);

  return (
    <div className="invoice-container">
      <h2>Invoice {invoice.invoice_number}</h2>
      <p>Status: <span className={`badge badge-${invoice.status}`}>{invoice.status}</span></p>
      
      {/* Historical Line Items (Frozen Snapshots) */}
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.invoice_items.map((item: any) => (
            <tr key={item.id}>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>${item.unit_price}</td>
              <td>${item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial Summary */}
      <div className="summary">
        <p>Subtotal: ${invoice.subtotal}</p>
        <p>Tax (10%): ${invoice.tax_amount}</p>
        {Number(invoice.discount_amount) > 0 && (
          <p>Discount ({invoice.coupon_code || 'Promo'}): -${invoice.discount_amount}</p>
        )}
        <h3>Total: ${invoice.total_amount}</h3>
        <p>Amount Paid: ${invoice.amount_paid}</p>
        <h4>Outstanding Balance: ${invoice.outstanding_balance}</h4>
      </div>
    </div>
  );
}
```

### B. Recording Partial & Full Payments
Trigger `recordPaymentAction` from your payment modal or checkout form:
```tsx
'use client';
import { useState } from 'react';
import { recordPaymentAction } from '@/actions/billing';

export function PaymentModal({ invoiceId, outstandingBalance, onPaymentSuccess }: any) {
  const [amount, setAmount] = useState(outstandingBalance);
  const [method, setMethod] = useState<'credit_card' | 'bank_transfer' | 'cash'>('credit_card');
  const [loading, setLoading] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await recordPaymentAction({
        invoiceId,
        amount: Number(amount),
        paymentMethod: method,
        reference: `txn_${Date.now()}`,
      });
      alert(`Payment recorded! Remaining balance: $${result.outstanding_balance}`);
      onPaymentSuccess(result);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay}>
      <label>Payment Amount ($):</label>
      <input 
        type="number" 
        step="0.01" 
        min="0.01" 
        max={outstandingBalance} 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
      />
      
      <label>Method:</label>
      <select value={method} onChange={(e: any) => setMethod(e.target.value)}>
        <option value="credit_card">Credit Card</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="cash">Cash</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : `Pay $${amount}`}
      </button>
    </form>
  );
}
```

---

## 2. For Adhil: Dashboard & Subscription Controls

### A. Admin Billing Dashboard Data
Fetch real-time metrics with `getBillingDashboardAction`:
```tsx
import { getBillingDashboardAction } from '@/actions/billing';

export default async function AdminBillingDashboard() {
  const data = await getBillingDashboardAction();

  return (
    <div className="dashboard-grid">
      {/* Revenue Card */}
      <div className="card">
        <h3>Total Revenue Collected</h3>
        <p className="metric">${data.revenue.total_collected} {data.revenue.currency}</p>
      </div>

      {/* Outstanding Invoices Card */}
      <div className="card">
        <h3>Outstanding Invoices</h3>
        <p className="metric">{data.outstanding_invoices.count} Invoices</p>
        <p className="subtext">Unpaid: ${data.outstanding_invoices.total_outstanding}</p>
      </div>

      {/* Overdue Accounts Card */}
      <div className="card alert">
        <h3>Overdue Billing</h3>
        <p className="metric">{data.overdue_billing.count} Overdue</p>
        <p className="subtext">Overdue Amount: ${data.overdue_billing.total_overdue}</p>
      </div>

      {/* Subscription Breakdown */}
      <div className="card">
        <h3>Subscriptions ({data.subscriptions.total})</h3>
        <ul>
          <li>Active: {data.subscriptions.active}</li>
          <li>Trialing: {data.subscriptions.trialing}</li>
          <li>Paused: {data.subscriptions.paused}</li>
          <li>Past Due: {data.subscriptions.past_due}</li>
          <li>Cancelled: {data.subscriptions.cancelled}</li>
        </ul>
      </div>
    </div>
  );
}
```

### B. Subscription Status Control Actions
Use `transitionSubscriptionStatusAction` with valid state machine paths:
* Allowed transitions:
  * `trialing` → `active`, `cancelled`
  * `active` → `paused`, `past_due`, `cancelled`
  * `paused` → `active`, `cancelled`
  * `past_due` → `active`, `cancelled`
  * `cancelled` → terminal (no further transitions)

```tsx
'use client';
import { transitionSubscriptionStatusAction } from '@/actions/billing';

export function SubscriptionControls({ subscriptionId, currentStatus, onStatusChange }: any) {
  async function handleTransition(newStatus: any) {
    try {
      const updated = await transitionSubscriptionStatusAction(subscriptionId, newStatus);
      onStatusChange(updated.status);
    } catch (err: any) {
      alert(`Invalid transition: ${err.message}`);
    }
  }

  return (
    <div className="btn-group">
      {currentStatus === 'active' && (
        <button onClick={() => handleTransition('paused')}>Pause Subscription</button>
      )}
      {currentStatus === 'paused' && (
        <button onClick={() => handleTransition('active')}>Resume Subscription</button>
      )}
      {currentStatus !== 'cancelled' && (
        <button className="danger" onClick={() => handleTransition('cancelled')}>Cancel</button>
      )}
    </div>
  );
}
```

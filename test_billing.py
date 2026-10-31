"""Comprehensive unit and end-to-end integration test suite for Subscription & Billing domain."""
import sqlite3
import unittest
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from src.billing import (
    BillingService,
    SubscriptionStatus,
    BillingInterval,
    InvoiceStatus,
    PaymentMethod,
    PaymentStatus,
    InvalidStatusTransitionError,
    DuplicateInvoiceError,
    InvalidPaymentError,
    calculate_period_end,
    calculate_next_billing_date,
    calculate_line_item,
    calculate_invoice_totals,
    calculate_outstanding_balance,
)


class TestBillingDomain(unittest.TestCase):
    def setUp(self):
        # In-memory SQLite connection for rapid, isolated testing
        self.conn = sqlite3.connect(":memory:")
        self.service = BillingService(self.conn)

        # Create baseline customer, product, and plan
        self.customer = self.service.create_customer("Acme Corp", "billing@acme.com")
        self.product = self.service.create_product("Cloud Platform", "Enterprise Cloud")
        self.monthly_plan = self.service.create_plan(
            product_id=self.product["id"],
            name="Pro Monthly",
            price=Decimal("100.00"),
            billing_interval=BillingInterval.MONTHLY,
            tax_rate=Decimal("10.00"),  # 10% tax
        )
        self.yearly_plan = self.service.create_plan(
            product_id=self.product["id"],
            name="Pro Annual",
            price=Decimal("1000.00"),
            billing_interval=BillingInterval.YEARLY,
            tax_rate=Decimal("10.00"),
        )

    def tearDown(self):
        self.conn.close()

    # -------------------------------------------------------------
    # Task 4 Tests: Billing Date Calculations
    # -------------------------------------------------------------
    def test_billing_date_calculations(self):
        start = datetime(2026, 1, 15, 0, 0, 0, tzinfo=timezone.utc)

        # Weekly
        weekly_end = calculate_period_end(start, BillingInterval.WEEKLY)
        self.assertEqual(weekly_end, datetime(2026, 1, 22, 0, 0, 0, tzinfo=timezone.utc))

        # Monthly
        monthly_end = calculate_period_end(start, BillingInterval.MONTHLY)
        self.assertEqual(monthly_end, datetime(2026, 2, 15, 0, 0, 0, tzinfo=timezone.utc))

        # Quarterly
        quarterly_end = calculate_period_end(start, BillingInterval.QUARTERLY)
        self.assertEqual(quarterly_end, datetime(2026, 4, 15, 0, 0, 0, tzinfo=timezone.utc))

        # Yearly
        yearly_end = calculate_period_end(start, BillingInterval.YEARLY)
        self.assertEqual(yearly_end, datetime(2027, 1, 15, 0, 0, 0, tzinfo=timezone.utc))

        # Month end leap year boundary handling (Jan 31 -> Feb 28)
        jan_31 = datetime(2026, 1, 31, 0, 0, 0, tzinfo=timezone.utc)
        feb_end = calculate_period_end(jan_31, BillingInterval.MONTHLY)
        self.assertEqual(feb_end, datetime(2026, 2, 28, 0, 0, 0, tzinfo=timezone.utc))

    # -------------------------------------------------------------
    # Financial Calculation & Strict Decimal Tests
    # -------------------------------------------------------------
    def test_strict_financial_calculations(self):
        # 3 items at $33.33 with 8.25% tax
        subtotal, tax, total = calculate_line_item(3, Decimal("33.33"), Decimal("8.25"))
        self.assertEqual(subtotal, Decimal("99.99"))
        # 99.99 * 0.0825 = 8.249175 -> rounded to 8.25
        self.assertEqual(tax, Decimal("8.25"))
        self.assertEqual(total, Decimal("108.24"))

        # Invoice totals with discount
        items = [{"quantity": 3, "unit_price": Decimal("33.33"), "tax_rate": Decimal("8.25")}]
        totals = calculate_invoice_totals(items, discount_amount=Decimal("10.00"))
        self.assertEqual(totals["subtotal"], Decimal("99.99"))
        self.assertEqual(totals["tax_amount"], Decimal("8.25"))
        self.assertEqual(totals["discount_amount"], Decimal("10.00"))
        self.assertEqual(totals["total_amount"], Decimal("98.24"))

        # Outstanding balance
        bal = calculate_outstanding_balance(Decimal("98.24"), Decimal("50.00"))
        self.assertEqual(bal, Decimal("48.24"))

    # -------------------------------------------------------------
    # Task 2 & 3 Tests: Subscription Lifecycle & Status Transitions
    # -------------------------------------------------------------
    def test_subscription_creation_and_update(self):
        sub = self.service.create_subscription(
            customer_id=self.customer["id"],
            plan_id=self.monthly_plan["id"],
            quantity=2,
            status=SubscriptionStatus.ACTIVE
        )
        self.assertEqual(sub["customer_id"], self.customer["id"])
        self.assertEqual(sub["quantity"], 2)
        self.assertEqual(sub["status"], SubscriptionStatus.ACTIVE.value)

        # Update subscription quantity and cancel_at_period_end
        updated = self.service.update_subscription(
            sub["id"],
            quantity=5,
            cancel_at_period_end=True
        )
        self.assertEqual(updated["quantity"], 5)
        self.assertEqual(updated["cancel_at_period_end"], 1)

    def test_subscription_status_transitions(self):
        sub = self.service.create_subscription(
            customer_id=self.customer["id"],
            plan_id=self.monthly_plan["id"],
            status=SubscriptionStatus.TRIALING
        )

        # Trialing -> Active
        sub = self.service.transition_subscription_status(sub["id"], SubscriptionStatus.ACTIVE)
        self.assertEqual(sub["status"], SubscriptionStatus.ACTIVE.value)

        # Active -> Paused
        sub = self.service.transition_subscription_status(sub["id"], SubscriptionStatus.PAUSED)
        self.assertEqual(sub["status"], SubscriptionStatus.PAUSED.value)
        self.assertIsNotNone(sub["paused_at"])

        # Paused -> Active
        sub = self.service.transition_subscription_status(sub["id"], SubscriptionStatus.ACTIVE)
        self.assertEqual(sub["status"], SubscriptionStatus.ACTIVE.value)
        self.assertIsNone(sub["paused_at"])

        # Active -> Past Due
        sub = self.service.transition_subscription_status(sub["id"], SubscriptionStatus.PAST_DUE)
        self.assertEqual(sub["status"], SubscriptionStatus.PAST_DUE.value)

        # Past Due -> Cancelled
        sub = self.service.transition_subscription_status(sub["id"], SubscriptionStatus.CANCELLED)
        self.assertEqual(sub["status"], SubscriptionStatus.CANCELLED.value)
        self.assertIsNotNone(sub["canceled_at"])

        # Cancelled is terminal -> Attempting transition from cancelled should fail
        with self.assertRaises(InvalidStatusTransitionError):
            self.service.transition_subscription_status(sub["id"], SubscriptionStatus.ACTIVE)

    def test_invalid_status_transition_rejection(self):
        # Direct Trialing -> Paused is invalid
        sub = self.service.create_subscription(
            customer_id=self.customer["id"],
            plan_id=self.monthly_plan["id"],
            status=SubscriptionStatus.TRIALING
        )
        with self.assertRaises(InvalidStatusTransitionError):
            self.service.transition_subscription_status(sub["id"], SubscriptionStatus.PAUSED)

    # -------------------------------------------------------------
    # Task 5 & 6 Tests: Invoice Generation, Snapshots, & Duplicate Prevention
    # -------------------------------------------------------------
    def test_invoice_generation_with_snapshots(self):
        sub = self.service.create_subscription(
            customer_id=self.customer["id"],
            plan_id=self.monthly_plan["id"],
            quantity=2,
            status=SubscriptionStatus.ACTIVE
        )
        invoice = self.service.generate_subscription_invoice(sub["id"])
        
        # 2 units * $100.00 = $200.00 subtotal, 10% tax = $20.00 -> $220.00 total
        self.assertEqual(invoice["subtotal"], Decimal("200.00"))
        self.assertEqual(invoice["tax_amount"], Decimal("20.00"))
        self.assertEqual(invoice["total_amount"], Decimal("220.00"))
        self.assertEqual(invoice["amount_paid"], Decimal("0.00"))
        self.assertEqual(invoice["outstanding_balance"], Decimal("220.00"))
        self.assertEqual(invoice["status"], InvoiceStatus.OPEN.value)

        # Verify snapshot preservation: changing plan price in catalog should NOT affect existing invoice
        with self.conn:
            self.conn.execute("UPDATE plans SET price = '500.00' WHERE id = ?", (self.monthly_plan["id"],))

        refetched_invoice = self.service.get_invoice(invoice["id"])
        self.assertEqual(refetched_invoice["total_amount"], Decimal("220.00"))
        self.assertEqual(refetched_invoice["items"][0]["unit_price"], Decimal("100.00"))

    def test_duplicate_invoice_prevention(self):
        sub = self.service.create_subscription(
            customer_id=self.customer["id"],
            plan_id=self.monthly_plan["id"],
            quantity=1
        )
        # First generation succeeds
        self.service.generate_subscription_invoice(sub["id"])

        # Second generation for the exact same billing cycle must fail with DuplicateInvoiceError
        with self.assertRaises(DuplicateInvoiceError):
            self.service.generate_subscription_invoice(sub["id"])

    # -------------------------------------------------------------
    # Task 7 Tests: Payment Recording & Partial Payments
    # -------------------------------------------------------------
    def test_payment_recording_and_partial_payments(self):
        sub = self.service.create_subscription(
            customer_id=self.customer["id"],
            plan_id=self.monthly_plan["id"],
            quantity=1
        )
        # Total is $100 + $10 tax = $110.00
        invoice = self.service.generate_subscription_invoice(sub["id"])
        self.assertEqual(invoice["total_amount"], Decimal("110.00"))
        self.assertEqual(invoice["status"], InvoiceStatus.OPEN.value)

        # Partial Payment 1: $40.00
        pay1 = self.service.record_payment(
            invoice_id=invoice["id"],
            amount=Decimal("40.00"),
            payment_method=PaymentMethod.CREDIT_CARD,
            transaction_reference="ch_12345"
        )
        self.assertEqual(pay1["amount_paid"], Decimal("40.00"))
        self.assertEqual(pay1["outstanding_balance"], Decimal("70.00"))
        self.assertEqual(pay1["invoice_status"], InvoiceStatus.OPEN.value)

        # Partial Payment 2: $70.00 (completes the invoice)
        pay2 = self.service.record_payment(
            invoice_id=invoice["id"],
            amount=Decimal("70.00"),
            payment_method=PaymentMethod.BANK_TRANSFER,
            transaction_reference="bt_67890"
        )
        self.assertEqual(pay2["amount_paid"], Decimal("110.00"))
        self.assertEqual(pay2["outstanding_balance"], Decimal("0.00"))
        self.assertEqual(pay2["invoice_status"], InvoiceStatus.PAID.value)

        # Verify persisted invoice record
        final_inv = self.service.get_invoice(invoice["id"])
        self.assertEqual(final_inv["status"], InvoiceStatus.PAID.value)
        self.assertIsNotNone(final_inv["paid_at"])
        self.assertEqual(len(final_inv["payments"]), 2)

    def test_invalid_payment_amount_rejected(self):
        sub = self.service.create_subscription(
            customer_id=self.customer["id"],
            plan_id=self.monthly_plan["id"]
        )
        invoice = self.service.generate_subscription_invoice(sub["id"])
        with self.assertRaises(InvalidPaymentError):
            self.service.record_payment(
                invoice_id=invoice["id"],
                amount=Decimal("-10.00"),
                payment_method=PaymentMethod.CASH
            )

    # -------------------------------------------------------------
    # Task 8 & 9 Tests: Dashboard Data & End-to-End Verification
    # -------------------------------------------------------------
    def test_dashboard_data_and_end_to_end_flow(self):
        # 1. Customer A: Active sub, generates invoice, pays in full
        sub_a = self.service.create_subscription(
            customer_id=self.customer["id"],
            plan_id=self.monthly_plan["id"],
            status=SubscriptionStatus.ACTIVE
        )
        inv_a = self.service.generate_subscription_invoice(sub_a["id"])
        self.service.record_payment(
            invoice_id=inv_a["id"],
            amount=inv_a["total_amount"],
            payment_method=PaymentMethod.CREDIT_CARD
        )

        # 2. Customer B: Sub trialing, no invoice yet
        cust_b = self.service.create_customer("Beta Inc", "beta@corp.com")
        self.service.create_subscription(
            customer_id=cust_b["id"],
            plan_id=self.yearly_plan["id"],
            status=SubscriptionStatus.TRIALING
        )

        # 3. Customer C: Active sub, generated invoice, past due date, unpaid
        cust_c = self.service.create_customer("Gamma LLC", "gamma@corp.com")
        sub_c = self.service.create_subscription(
            customer_id=cust_c["id"],
            plan_id=self.monthly_plan["id"],
            status=SubscriptionStatus.ACTIVE
        )
        # Due yesterday
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        inv_c = self.service.generate_subscription_invoice(
            sub_c["id"],
            due_date=yesterday
        )

        # 4. Query Dashboard Metrics
        dashboard = self.service.get_billing_dashboard_data()

        # Check Subscription counts
        self.assertEqual(dashboard["subscriptions"]["total"], 3)
        self.assertEqual(dashboard["subscriptions"]["active"], 2)
        self.assertEqual(dashboard["subscriptions"]["trialing"], 1)

        # Check Revenue (only inv_a paid $110.00)
        self.assertEqual(dashboard["revenue"]["total_collected"], Decimal("110.00"))

        # Check Outstanding Invoices (inv_c is unpaid $110.00)
        self.assertEqual(dashboard["outstanding_invoices"]["count"], 1)
        self.assertEqual(dashboard["outstanding_invoices"]["total_outstanding"], Decimal("110.00"))

        # Check Overdue Invoices (inv_c is due yesterday)
        self.assertEqual(dashboard["overdue_billing"]["count"], 1)
        self.assertEqual(dashboard["overdue_billing"]["total_overdue"], Decimal("110.00"))


if __name__ == "__main__":
    unittest.main()

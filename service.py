"""Billing service implementing subscription lifecycle, invoicing, payments, and dashboard queries."""
import sqlite3
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any

from src.billing.types import (
    SubscriptionStatus,
    BillingInterval,
    InvoiceStatus,
    PaymentMethod,
    PaymentStatus,
    validate_subscription_transition,
    InvalidStatusTransitionError,
)
from src.billing.dates import (
    calculate_period_end,
    calculate_next_billing_date,
    calculate_initial_dates,
)
from src.billing.calculations import (
    to_decimal,
    calculate_line_item,
    calculate_invoice_totals,
    calculate_outstanding_balance,
)


class DuplicateInvoiceError(Exception):
    """Raised when an invoice already exists for the same subscription and period."""
    pass


class InvoiceNotFoundError(Exception):
    pass


class SubscriptionNotFoundError(Exception):
    pass


class PlanNotFoundError(Exception):
    pass


class CustomerNotFoundError(Exception):
    pass


class InvalidPaymentError(Exception):
    pass


class BillingService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        """Initialize tables and unique constraints for SQLite backing store."""
        cur = self.conn.cursor()
        cur.execute("PRAGMA foreign_keys = ON;")
        
        # Core Tables
        cur.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS plans (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL REFERENCES products(id),
                name TEXT NOT NULL,
                price TEXT NOT NULL,
                billing_interval TEXT NOT NULL,
                currency TEXT NOT NULL DEFAULT 'USD',
                tax_rate TEXT NOT NULL DEFAULT '0.00',
                created_at TEXT NOT NULL
            );
        """)
        
        # Billing Domain Tables
        cur.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL REFERENCES customers(id),
                plan_id TEXT NOT NULL REFERENCES plans(id),
                quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
                status TEXT NOT NULL,
                billing_interval TEXT NOT NULL,
                start_date TEXT NOT NULL,
                current_period_start TEXT NOT NULL,
                current_period_end TEXT NOT NULL,
                next_billing_date TEXT NOT NULL,
                trial_end TEXT,
                paused_at TEXT,
                cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
                canceled_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                invoice_number TEXT NOT NULL UNIQUE,
                customer_id TEXT NOT NULL REFERENCES customers(id),
                subscription_id TEXT REFERENCES subscriptions(id),
                billing_period_start TEXT,
                billing_period_end TEXT,
                subtotal TEXT NOT NULL DEFAULT '0.00',
                tax_amount TEXT NOT NULL DEFAULT '0.00',
                discount_amount TEXT NOT NULL DEFAULT '0.00',
                total_amount TEXT NOT NULL DEFAULT '0.00',
                amount_paid TEXT NOT NULL DEFAULT '0.00',
                status TEXT NOT NULL,
                due_date TEXT NOT NULL,
                paid_at TEXT,
                created_at TEXT NOT NULL
            );
        """)
        
        # Duplicate invoice prevention index
        cur.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_sub_period 
            ON invoices (subscription_id, billing_period_start, billing_period_end) 
            WHERE subscription_id IS NOT NULL AND status != 'void';
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS invoice_items (
                id TEXT PRIMARY KEY,
                invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
                product_id TEXT REFERENCES products(id),
                plan_id TEXT REFERENCES plans(id),
                description TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
                unit_price TEXT NOT NULL,
                tax_rate TEXT NOT NULL DEFAULT '0.00',
                total TEXT NOT NULL
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                invoice_id TEXT NOT NULL REFERENCES invoices(id),
                amount TEXT NOT NULL,
                payment_method TEXT NOT NULL,
                status TEXT NOT NULL,
                transaction_reference TEXT,
                payment_date TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)
        
        self.conn.commit()

    # -------------------------------------------------------------
    # Helper Setup Methods for Core Foundation Data
    # -------------------------------------------------------------
    def create_customer(self, name: str, email: str) -> dict:
        cid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        with self.conn:
            self.conn.execute(
                "INSERT INTO customers (id, name, email, created_at) VALUES (?, ?, ?, ?)",
                (cid, name, email, now)
            )
        return {"id": cid, "name": name, "email": email, "created_at": now}

    def create_product(self, name: str, description: Optional[str] = None) -> dict:
        pid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        with self.conn:
            self.conn.execute(
                "INSERT INTO products (id, name, description, is_active, created_at) VALUES (?, ?, ?, 1, ?)",
                (pid, name, description, now)
            )
        return {"id": pid, "name": name, "description": description, "created_at": now}

    def create_plan(
        self,
        product_id: str,
        name: str,
        price: Decimal,
        billing_interval: BillingInterval,
        currency: str = "USD",
        tax_rate: Decimal = Decimal("0.00")
    ) -> dict:
        plan_id = str(uuid.uuid4())
        price_dec = to_decimal(price)
        tax_dec = to_decimal(tax_rate)
        now = datetime.now(timezone.utc).isoformat()
        with self.conn:
            self.conn.execute(
                """INSERT INTO plans (id, product_id, name, price, billing_interval, currency, tax_rate, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (plan_id, product_id, name, str(price_dec), billing_interval.value, currency, str(tax_dec), now)
            )
        return {
            "id": plan_id,
            "product_id": product_id,
            "name": name,
            "price": price_dec,
            "billing_interval": billing_interval,
            "currency": currency,
            "tax_rate": tax_dec,
        }

    # -------------------------------------------------------------
    # Task 2 & 4: Subscription Operations & Dates
    # -------------------------------------------------------------
    def create_subscription(
        self,
        customer_id: str,
        plan_id: str,
        quantity: int = 1,
        status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
        start_date: Optional[datetime] = None,
        billing_interval: Optional[BillingInterval] = None
    ) -> dict:
        if quantity <= 0:
            raise ValueError("Subscription quantity must be greater than zero")

        cur = self.conn.cursor()
        # Verify customer
        cur.execute("SELECT id FROM customers WHERE id = ?", (customer_id,))
        if not cur.fetchone():
            raise CustomerNotFoundError(f"Customer {customer_id} not found")

        # Verify plan
        cur.execute("SELECT * FROM plans WHERE id = ?", (plan_id,))
        plan = cur.fetchone()
        if not plan:
            raise PlanNotFoundError(f"Plan {plan_id} not found")

        interval = billing_interval or BillingInterval(plan["billing_interval"])
        start = start_date or datetime.now(timezone.utc)
        date_info = calculate_initial_dates(start, interval)

        sub_id = str(uuid.uuid4())
        now_str = datetime.now(timezone.utc).isoformat()
        
        trial_end = None
        if status == SubscriptionStatus.TRIALING:
            # 14 days trial default
            trial_end = (start + timedelta(days=14)).isoformat()

        with self.conn:
            self.conn.execute(
                """INSERT INTO subscriptions (
                    id, customer_id, plan_id, quantity, status, billing_interval,
                    start_date, current_period_start, current_period_end, next_billing_date,
                    trial_end, paused_at, cancel_at_period_end, canceled_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, NULL, ?, ?)""",
                (
                    sub_id,
                    customer_id,
                    plan_id,
                    quantity,
                    status.value,
                    interval.value,
                    date_info["start_date"].isoformat(),
                    date_info["current_period_start"].isoformat(),
                    date_info["current_period_end"].isoformat(),
                    date_info["next_billing_date"].isoformat(),
                    trial_end,
                    now_str,
                    now_str
                )
            )

        return self.get_subscription(sub_id)

    def get_subscription(self, subscription_id: str) -> dict:
        cur = self.conn.cursor()
        cur.execute("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,))
        row = cur.fetchone()
        if not row:
            raise SubscriptionNotFoundError(f"Subscription {subscription_id} not found")
        return dict(row)

    def list_subscriptions(
        self,
        customer_id: Optional[str] = None,
        status: Optional[SubscriptionStatus] = None
    ) -> List[dict]:
        query = "SELECT * FROM subscriptions WHERE 1=1"
        params = []
        if customer_id:
            query += " AND customer_id = ?"
            params.append(customer_id)
        if status:
            query += " AND status = ?"
            params.append(status.value)
        query += " ORDER BY created_at DESC"
        cur = self.conn.cursor()
        cur.execute(query, params)
        return [dict(row) for row in cur.fetchall()]

    def update_subscription(
        self,
        subscription_id: str,
        plan_id: Optional[str] = None,
        quantity: Optional[int] = None,
        cancel_at_period_end: Optional[bool] = None
    ) -> dict:
        sub = self.get_subscription(subscription_id)
        updates = []
        params = []

        if plan_id is not None:
            cur = self.conn.cursor()
            cur.execute("SELECT * FROM plans WHERE id = ?", (plan_id,))
            plan = cur.fetchone()
            if not plan:
                raise PlanNotFoundError(f"Plan {plan_id} not found")
            updates.append("plan_id = ?")
            params.append(plan_id)
            updates.append("billing_interval = ?")
            params.append(plan["billing_interval"])

        if quantity is not None:
            if quantity <= 0:
                raise ValueError("Quantity must be greater than zero")
            updates.append("quantity = ?")
            params.append(quantity)

        if cancel_at_period_end is not None:
            updates.append("cancel_at_period_end = ?")
            params.append(1 if cancel_at_period_end else 0)

        if not updates:
            return sub

        now_str = datetime.now(timezone.utc).isoformat()
        updates.append("updated_at = ?")
        params.append(now_str)
        params.append(subscription_id)

        sql = f"UPDATE subscriptions SET {', '.join(updates)} WHERE id = ?"
        with self.conn:
            self.conn.execute(sql, params)

        return self.get_subscription(subscription_id)

    # -------------------------------------------------------------
    # Task 3: Subscription Status Transitions & Server Validation
    # -------------------------------------------------------------
    def transition_subscription_status(
        self,
        subscription_id: str,
        new_status: SubscriptionStatus
    ) -> dict:
        sub = self.get_subscription(subscription_id)
        current_status = SubscriptionStatus(sub["status"])
        
        # Server-side validation against state transition rules
        validate_subscription_transition(current_status, new_status)

        now = datetime.now(timezone.utc).isoformat()
        updates = ["status = ?", "updated_at = ?"]
        params = [new_status.value, now]

        if new_status == SubscriptionStatus.PAUSED:
            updates.append("paused_at = ?")
            params.append(now)
        elif new_status == SubscriptionStatus.CANCELLED:
            updates.append("canceled_at = ?")
            params.append(now)
        elif new_status == SubscriptionStatus.ACTIVE and current_status == SubscriptionStatus.PAUSED:
            updates.append("paused_at = NULL")

        params.append(subscription_id)
        sql = f"UPDATE subscriptions SET {', '.join(updates)} WHERE id = ?"

        with self.conn:
            self.conn.execute(sql, params)

        return self.get_subscription(subscription_id)

    # -------------------------------------------------------------
    # Task 5 & 6: Invoice Generation & Duplicate Prevention
    # -------------------------------------------------------------
    def generate_subscription_invoice(
        self,
        subscription_id: str,
        billing_period_start: Optional[datetime] = None,
        billing_period_end: Optional[datetime] = None,
        due_date: Optional[datetime] = None,
        discount_amount: Decimal = Decimal("0.00")
    ) -> dict:
        sub = self.get_subscription(subscription_id)
        
        # Load associated plan
        cur = self.conn.cursor()
        cur.execute("SELECT p.*, prod.name as product_name FROM plans p JOIN products prod ON p.product_id = prod.id WHERE p.id = ?", (sub["plan_id"],))
        plan = cur.fetchone()
        if not plan:
            raise PlanNotFoundError(f"Plan {sub['plan_id']} not found")

        # Determine period bounds
        period_start = billing_period_start.isoformat() if billing_period_start else sub["current_period_start"]
        period_end = billing_period_end.isoformat() if billing_period_end else sub["current_period_end"]

        # Duplicate Prevention check
        cur.execute(
            """SELECT id, invoice_number FROM invoices 
               WHERE subscription_id = ? AND billing_period_start = ? AND billing_period_end = ? 
               AND status != 'void'""",
            (subscription_id, period_start, period_end)
        )
        existing = cur.fetchone()
        if existing:
            raise DuplicateInvoiceError(
                f"Duplicate invoice detected: Invoice {existing['invoice_number']} already exists for "
                f"subscription {subscription_id} covering period {period_start} to {period_end}."
            )

        # Build Line Item Snapshot
        qty = sub["quantity"]
        unit_price = to_decimal(plan["price"])
        tax_rate = to_decimal(plan["tax_rate"])
        description_snapshot = f"{plan['product_name']} - {plan['name']} ({sub['billing_interval']})"
        
        line_sub, line_tax, line_total = calculate_line_item(qty, unit_price, tax_rate)
        
        items = [{
            "description": description_snapshot,
            "quantity": qty,
            "unit_price": unit_price,
            "tax_rate": tax_rate,
            "total": line_total,
            "plan_id": plan["id"],
            "product_id": plan["product_id"],
        }]

        totals = calculate_invoice_totals(items, discount_amount)
        
        invoice_id = str(uuid.uuid4())
        invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        now_dt = datetime.now(timezone.utc)
        due = due_date.isoformat() if due_date else (now_dt + timedelta(days=14)).isoformat()
        now_str = now_dt.isoformat()

        try:
            with self.conn:
                self.conn.execute(
                    """INSERT INTO invoices (
                        id, invoice_number, customer_id, subscription_id,
                        billing_period_start, billing_period_end, subtotal, tax_amount,
                        discount_amount, total_amount, amount_paid, status, due_date, paid_at, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '0.00', ?, ?, NULL, ?)""",
                    (
                        invoice_id,
                        invoice_number,
                        sub["customer_id"],
                        subscription_id,
                        period_start,
                        period_end,
                        str(totals["subtotal"]),
                        str(totals["tax_amount"]),
                        str(totals["discount_amount"]),
                        str(totals["total_amount"]),
                        InvoiceStatus.OPEN.value,
                        due,
                        now_str
                    )
                )

                # Persist Item Snapshot
                item_id = str(uuid.uuid4())
                self.conn.execute(
                    """INSERT INTO invoice_items (
                        id, invoice_id, product_id, plan_id, description, quantity, unit_price, tax_rate, total
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        item_id,
                        invoice_id,
                        plan["product_id"],
                        plan["id"],
                        description_snapshot,
                        qty,
                        str(unit_price),
                        str(tax_rate),
                        str(line_total)
                    )
                )
        except sqlite3.IntegrityError as e:
            if "idx_unique_sub_period" in str(e):
                raise DuplicateInvoiceError(
                    f"Integrity constraint violation: duplicate invoice for subscription {subscription_id} in period {period_start} to {period_end}."
                )
            raise

        return self.get_invoice(invoice_id)

    def get_invoice(self, invoice_id: str) -> dict:
        cur = self.conn.cursor()
        cur.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
        inv = cur.fetchone()
        if not inv:
            raise InvoiceNotFoundError(f"Invoice {invoice_id} not found")

        inv_dict = dict(inv)
        inv_dict["subtotal"] = to_decimal(inv_dict["subtotal"])
        inv_dict["tax_amount"] = to_decimal(inv_dict["tax_amount"])
        inv_dict["discount_amount"] = to_decimal(inv_dict["discount_amount"])
        inv_dict["total_amount"] = to_decimal(inv_dict["total_amount"])
        inv_dict["amount_paid"] = to_decimal(inv_dict["amount_paid"])
        inv_dict["outstanding_balance"] = calculate_outstanding_balance(
            inv_dict["total_amount"], inv_dict["amount_paid"]
        )

        cur.execute("SELECT * FROM invoice_items WHERE invoice_id = ?", (invoice_id,))
        items = []
        for row in cur.fetchall():
            it = dict(row)
            it["unit_price"] = to_decimal(it["unit_price"])
            it["tax_rate"] = to_decimal(it["tax_rate"])
            it["total"] = to_decimal(it["total"])
            items.append(it)
        inv_dict["items"] = items

        cur.execute("SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at ASC", (invoice_id,))
        payments = []
        for row in cur.fetchall():
            p = dict(row)
            p["amount"] = to_decimal(p["amount"])
            payments.append(p)
        inv_dict["payments"] = payments

        return inv_dict

    # -------------------------------------------------------------
    # Task 7: Payment Recording & Partial Payments
    # -------------------------------------------------------------
    def record_payment(
        self,
        invoice_id: str,
        amount: Decimal,
        payment_method: PaymentMethod,
        transaction_reference: Optional[str] = None,
        status: PaymentStatus = PaymentStatus.SUCCEEDED
    ) -> dict:
        amount_dec = to_decimal(amount)
        if amount_dec <= Decimal("0.00"):
            raise InvalidPaymentError("Payment amount must be greater than zero")

        invoice = self.get_invoice(invoice_id)
        if invoice["status"] == InvoiceStatus.VOID.value:
            raise InvalidPaymentError("Cannot record payment on a voided invoice")

        payment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        with self.conn:
            self.conn.execute(
                """INSERT INTO payments (
                    id, invoice_id, amount, payment_method, status, transaction_reference, payment_date, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    payment_id,
                    invoice_id,
                    str(amount_dec),
                    payment_method.value,
                    status.value,
                    transaction_reference,
                    now,
                    now
                )
            )

            if status == PaymentStatus.SUCCEEDED:
                new_amount_paid = (invoice["amount_paid"] + amount_dec).quantize(Decimal("0.01"))
                
                # Check if fully paid
                if new_amount_paid >= invoice["total_amount"]:
                    new_status = InvoiceStatus.PAID.value
                    paid_at = now
                else:
                    new_status = InvoiceStatus.OPEN.value
                    paid_at = None

                self.conn.execute(
                    """UPDATE invoices 
                       SET amount_paid = ?, status = ?, paid_at = ? 
                       WHERE id = ?""",
                    (str(new_amount_paid), new_status, paid_at, invoice_id)
                )

        updated_invoice = self.get_invoice(invoice_id)
        return {
            "payment_id": payment_id,
            "invoice_id": invoice_id,
            "amount": amount_dec,
            "status": status.value,
            "payment_method": payment_method.value,
            "transaction_reference": transaction_reference,
            "amount_paid": updated_invoice["amount_paid"],
            "outstanding_balance": updated_invoice["outstanding_balance"],
            "invoice_status": updated_invoice["status"]
        }

    # -------------------------------------------------------------
    # Task 8: Dashboard Data Queries
    # -------------------------------------------------------------
    def get_billing_dashboard_data(self, as_of: Optional[datetime] = None) -> dict:
        as_of_dt = as_of or datetime.now(timezone.utc)
        as_of_str = as_of_dt.isoformat()
        cur = self.conn.cursor()

        # 1. Subscriptions by status
        cur.execute("""
            SELECT status, COUNT(*) as count 
            FROM subscriptions 
            GROUP BY status
        """)
        sub_counts = {
            "total": 0,
            "active": 0,
            "trialing": 0,
            "paused": 0,
            "past_due": 0,
            "cancelled": 0
        }
        for row in cur.fetchall():
            status = row["status"]
            cnt = row["count"]
            sub_counts[status] = cnt
            sub_counts["total"] += cnt

        # 2. Total collected revenue (sum of succeeded payments)
        cur.execute("""
            SELECT amount FROM payments WHERE status = 'succeeded'
        """)
        total_revenue = Decimal("0.00")
        for row in cur.fetchall():
            total_revenue += to_decimal(row["amount"])

        # 3. Outstanding Invoices (status = 'open' or 'draft')
        cur.execute("""
            SELECT total_amount, amount_paid, due_date 
            FROM invoices 
            WHERE status IN ('open', 'draft')
        """)
        outstanding_invoices_count = 0
        total_outstanding_amount = Decimal("0.00")
        overdue_invoices_count = 0
        total_overdue_amount = Decimal("0.00")

        for row in cur.fetchall():
            tot = to_decimal(row["total_amount"])
            paid = to_decimal(row["amount_paid"])
            bal = calculate_outstanding_balance(tot, paid)
            
            if bal > Decimal("0.00"):
                outstanding_invoices_count += 1
                total_outstanding_amount += bal
                
                # Check overdue: due_date < as_of_str
                if row["due_date"] < as_of_str:
                    overdue_invoices_count += 1
                    total_overdue_amount += bal

        return {
            "subscriptions": sub_counts,
            "revenue": {
                "total_collected": total_revenue.quantize(Decimal("0.01")),
                "currency": "USD"
            },
            "outstanding_invoices": {
                "count": outstanding_invoices_count,
                "total_outstanding": total_outstanding_amount.quantize(Decimal("0.01"))
            },
            "overdue_billing": {
                "count": overdue_invoices_count,
                "total_overdue": total_overdue_amount.quantize(Decimal("0.01"))
            },
            "as_of": as_of_str
        }

/**
 * Dashboard mock data.
 *
 * All values here are representative placeholders.
 * Replace with real Supabase queries when the data layer is ready.
 */

// ─── Metric Cards ────────────────────────────────────────────────────────────

export interface MetricData {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

export const METRICS: MetricData[] = [
  {
    label: "Monthly Recurring Revenue",
    value: "$24,850",
    change: "+12.4% from last month",
    trend: "up",
  },
  {
    label: "Active Subscriptions",
    value: "1,284",
    change: "+38 this month",
    trend: "up",
  },
  {
    label: "Invoices Outstanding",
    value: "$6,120",
    change: "14 unpaid invoices",
    trend: "down",
  },
  {
    label: "New Customers",
    value: "57",
    change: "+9 from last month",
    trend: "up",
  },
];

// ─── Revenue Chart ────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export const REVENUE_DATA: RevenueDataPoint[] = [
  { month: "May", revenue: 18200 },
  { month: "Jun", revenue: 19500 },
  { month: "Jul", revenue: 17800 },
  { month: "Aug", revenue: 21300 },
  { month: "Sep", revenue: 22100 },
  { month: "Oct", revenue: 24850 },
];

// ─── Recent Subscriptions ─────────────────────────────────────────────────────

export type SubscriptionStatus = "active" | "trialing" | "canceled" | "past_due";

export interface RecentSubscription {
  id: string;
  customer: string;
  plan: string;
  status: SubscriptionStatus;
  amount: string;
  startDate: string;
}

export const RECENT_SUBSCRIPTIONS: RecentSubscription[] = [
  {
    id: "sub_01",
    customer: "Acme Corp",
    plan: "Pro — Monthly",
    status: "active",
    amount: "$299/mo",
    startDate: "2026-10-28",
  },
  {
    id: "sub_02",
    customer: "Bright Digital",
    plan: "Starter — Annual",
    status: "active",
    amount: "$790/yr",
    startDate: "2026-10-25",
  },
  {
    id: "sub_03",
    customer: "NovaTech Ltd",
    plan: "Pro — Monthly",
    status: "trialing",
    amount: "$299/mo",
    startDate: "2026-10-22",
  },
  {
    id: "sub_04",
    customer: "Greenfields Inc",
    plan: "Enterprise — Annual",
    status: "past_due",
    amount: "$2,400/yr",
    startDate: "2026-09-15",
  },
  {
    id: "sub_05",
    customer: "Cobalt Systems",
    plan: "Starter — Monthly",
    status: "canceled",
    amount: "$79/mo",
    startDate: "2026-08-10",
  },
];

// ─── Recent Invoices ──────────────────────────────────────────────────────────

export type InvoiceStatus = "paid" | "pending" | "overdue";

export interface RecentInvoice {
  id: string;
  customer: string;
  amount: string;
  status: InvoiceStatus;
  dueDate: string;
}

export const RECENT_INVOICES: RecentInvoice[] = [
  {
    id: "INV-0041",
    customer: "Acme Corp",
    amount: "$299.00",
    status: "paid",
    dueDate: "2026-10-30",
  },
  {
    id: "INV-0040",
    customer: "Bright Digital",
    amount: "$790.00",
    status: "paid",
    dueDate: "2026-10-28",
  },
  {
    id: "INV-0039",
    customer: "Greenfields Inc",
    amount: "$2,400.00",
    status: "overdue",
    dueDate: "2026-10-15",
  },
  {
    id: "INV-0038",
    customer: "NovaTech Ltd",
    amount: "$299.00",
    status: "pending",
    dueDate: "2026-11-05",
  },
  {
    id: "INV-0037",
    customer: "Cobalt Systems",
    amount: "$79.00",
    status: "pending",
    dueDate: "2026-11-08",
  },
];


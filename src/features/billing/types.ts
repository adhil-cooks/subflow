import type { Database, SubscriptionStatus, InvoiceStatus, PaymentStatus, PaymentMethod, BillingInterval } from '@/types/database.types';

export type { SubscriptionStatus, InvoiceStatus, PaymentStatus, PaymentMethod, BillingInterval };

// Base Table Types
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];

export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert'];
export type InvoiceItemUpdate = Database['public']['Tables']['invoice_items']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type Customer = Database['public']['Tables']['customers']['Row'];
export type Plan = Database['public']['Tables']['plans']['Row'];
export type Discount = Database['public']['Tables']['discounts']['Row'];
export type TaxRate = Database['public']['Tables']['tax_rates']['Row'];

// Rich Joined / Detailed Types
export interface SubscriptionWithDetails extends Subscription {
  customer?: Customer | null;
  plan?: Plan | null;
  invoices?: Invoice[];
}

export interface InvoiceWithDetails extends Invoice {
  customer?: Customer | null;
  subscription?: Subscription | null;
  discount?: Discount | null;
  items: InvoiceItem[];
  payments: Payment[];
  remaining_balance: number;
  is_overdue: boolean;
}

export interface PaymentWithDetails extends Payment {
  invoice?: Invoice | null;
  customer?: Customer | null;
}

// Action Input Interfaces
export interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  quantity?: number;
  billingInterval?: BillingInterval;
  startDate?: string;
  trialDays?: number;
  unitPriceOverride?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  autoGenerateFirstInvoice?: boolean;
}

export interface UpdateSubscriptionInput {
  quantity?: number;
  planId?: string;
  cancelAtPeriodEnd?: boolean;
  unitPrice?: number;
  metadata?: Record<string, unknown>;
}

export interface GenerateInvoiceOptions {
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  discountId?: string;
  taxRate?: number;
  dueDate?: string;
  notes?: string;
  invoiceNumber?: string;
}

export interface CreateCustomInvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  planId?: string;
}

export interface CreateCustomInvoiceInput {
  customerId: string;
  items: CreateCustomInvoiceItemInput[];
  discountId?: string;
  dueDate?: string;
  notes?: string;
  currency?: string;
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface RecordPaymentResult {
  payment: Payment;
  invoice: InvoiceWithDetails;
  remainingBalance: number;
  isFullyPaid: boolean;
}

export interface SubscriptionFilterInput {
  customerId?: string;
  planId?: string;
  status?: SubscriptionStatus;
  limit?: number;
  offset?: number;
}

export interface InvoiceFilterInput {
  customerId?: string;
  subscriptionId?: string;
  status?: InvoiceStatus;
  overdueOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface PaymentFilterInput {
  invoiceId?: string;
  customerId?: string;
  status?: PaymentStatus;
  limit?: number;
  offset?: number;
}

// Dashboard Aggregates
export interface BillingDashboardMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  activeSubscriptionsCount: number;
  trialingSubscriptionsCount: number;
  pausedSubscriptionsCount: number;
  pastDueSubscriptionsCount: number;
  totalOutstandingAmount: number;
  overdueInvoicesCount: number;
  overdueInvoices: InvoiceWithDetails[];
  recentPayments: PaymentWithDetails[];
  recentInvoices: InvoiceWithDetails[];
}

// Standardized Server Action Result
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

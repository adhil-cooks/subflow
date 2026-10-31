export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'staff' | 'customer';
export type CustomerStatus = 'active' | 'inactive' | 'archived';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type VariantStatus = 'active' | 'inactive';
export type PlanStatus = 'active' | 'inactive' | 'archived';
export type BillingInterval = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type DiscountType = 'percentage' | 'fixed_amount';
export type SubscriptionStatus = 'trialing' | 'active' | 'paused' | 'past_due' | 'cancelled';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'stripe' | 'cash' | 'other';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          profile_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          billing_address: Json;
          shipping_address: Json;
          status: CustomerStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          billing_address?: Json;
          shipping_address?: Json;
          status?: CustomerStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          billing_address?: Json;
          shipping_address?: Json;
          status?: CustomerStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          status: ProductStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          status?: ProductStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          status?: ProductStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          sku: string | null;
          price: number;
          attributes: Json;
          status: VariantStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          sku?: string | null;
          price: number;
          attributes?: Json;
          status?: VariantStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          sku?: string | null;
          price?: number;
          attributes?: Json;
          status?: VariantStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      plans: {
        Row: {
          id: string;
          product_id: string | null;
          name: string;
          description: string | null;
          billing_interval: BillingInterval;
          price: number;
          currency: string;
          trial_period_days: number;
          status: PlanStatus;
          features: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          name: string;
          description?: string | null;
          billing_interval?: BillingInterval;
          price: number;
          currency?: string;
          trial_period_days?: number;
          status?: PlanStatus;
          features?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          name?: string;
          description?: string | null;
          billing_interval?: BillingInterval;
          price?: number;
          currency?: string;
          trial_period_days?: number;
          status?: PlanStatus;
          features?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'plans_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      plan_items: {
        Row: {
          id: string;
          plan_id: string;
          variant_id: string | null;
          name: string;
          quantity: number;
          unit_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          variant_id?: string | null;
          name: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          variant_id?: string | null;
          name?: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'plan_items_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'plans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'plan_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      discounts: {
        Row: {
          id: string;
          code: string;
          name: string;
          type: DiscountType;
          value: number;
          max_redemptions: number | null;
          times_redeemed: number;
          starts_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          type?: DiscountType;
          value: number;
          max_redemptions?: number | null;
          times_redeemed?: number;
          starts_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          type?: DiscountType;
          value?: number;
          max_redemptions?: number | null;
          times_redeemed?: number;
          starts_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_rates: {
        Row: {
          id: string;
          name: string;
          rate: number;
          country: string | null;
          state: string | null;
          is_compound: boolean;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rate: number;
          country?: string | null;
          state?: string | null;
          is_compound?: boolean;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rate?: number;
          country?: string | null;
          state?: string | null;
          is_compound?: boolean;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          customer_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          billing_interval: BillingInterval;
          currency: string;
          unit_price: number;
          quantity: number;
          start_date: string;
          current_period_start: string;
          current_period_end: string;
          trial_start: string | null;
          trial_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          ended_at: string | null;
          next_billing_date: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          plan_id: string;
          status?: SubscriptionStatus;
          billing_interval?: BillingInterval;
          currency?: string;
          unit_price?: number;
          quantity?: number;
          start_date?: string;
          current_period_start?: string;
          current_period_end: string;
          trial_start?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          ended_at?: string | null;
          next_billing_date?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          plan_id?: string;
          status?: SubscriptionStatus;
          billing_interval?: BillingInterval;
          currency?: string;
          unit_price?: number;
          quantity?: number;
          start_date?: string;
          current_period_start?: string;
          current_period_end?: string;
          trial_start?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          ended_at?: string | null;
          next_billing_date?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'plans';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          customer_id: string;
          subscription_id: string | null;
          discount_id: string | null;
          status: InvoiceStatus;
          currency: string;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          amount_paid: number;
          billing_period_start: string | null;
          billing_period_end: string | null;
          issue_date: string;
          due_date: string;
          paid_at: string | null;
          voided_at: string | null;
          notes: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          customer_id: string;
          subscription_id?: string | null;
          discount_id?: string | null;
          status?: InvoiceStatus;
          currency?: string;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          amount_paid?: number;
          billing_period_start?: string | null;
          billing_period_end?: string | null;
          issue_date?: string;
          due_date: string;
          paid_at?: string | null;
          voided_at?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          customer_id?: string;
          subscription_id?: string | null;
          discount_id?: string | null;
          status?: InvoiceStatus;
          currency?: string;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          amount_paid?: number;
          billing_period_start?: string | null;
          billing_period_end?: string | null;
          issue_date?: string;
          due_date?: string;
          paid_at?: string | null;
          voided_at?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_discount_id_fkey';
            columns: ['discount_id'];
            isOneToOne: false;
            referencedRelation: 'discounts';
            referencedColumns: ['id'];
          },
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          plan_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          tax_rate: number;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          plan_id?: string | null;
          description: string;
          quantity?: number;
          unit_price: number;
          tax_rate?: number;
          total: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          plan_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
          tax_rate?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invoice_items_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoice_items_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'plans';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          currency: string;
          payment_method: PaymentMethod;
          status: PaymentStatus;
          transaction_reference: string | null;
          payment_date: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          amount: number;
          currency?: string;
          payment_method?: PaymentMethod;
          status?: PaymentStatus;
          transaction_reference?: string | null;
          payment_date?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          amount?: number;
          currency?: string;
          payment_method?: PaymentMethod;
          status?: PaymentStatus;
          transaction_reference?: string | null;
          payment_date?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff_or_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      handle_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      sync_invoice_payments: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: {
      user_role: UserRole;
      customer_status: CustomerStatus;
      product_status: ProductStatus;
      variant_status: VariantStatus;
      plan_status: PlanStatus;
      billing_interval: BillingInterval;
      discount_type: DiscountType;
      subscription_status: SubscriptionStatus;
      invoice_status: InvoiceStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
    };
  };
}

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
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey',
            columns: ['id'],
            isOneToOne: true,
            referencedRelation: 'users',
            referencedColumns: ['id'],
          },
        ];
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
            foreignKeyName: 'customers_profile_id_fkey',
            columns: ['profile_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'customers_created_by_fkey',
            columns: ['created_by'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
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
        Relationships: [
          {
            foreignKeyName: 'products_created_by_fkey',
            columns: ['created_by'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ];
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
            foreignKeyName: 'product_variants_product_id_fkey',
            columns: ['product_id'],
            isOneToOne: false,
            referencedRelation: 'products',
            referencedColumns: ['id'],
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
            foreignKeyName: 'plans_product_id_fkey',
            columns: ['product_id'],
            isOneToOne: false,
            referencedRelation: 'products',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'plans_created_by_fkey',
            columns: ['created_by'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
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
            foreignKeyName: 'plan_items_plan_id_fkey',
            columns: ['plan_id'],
            isOneToOne: false,
            referencedRelation: 'plans',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'plan_items_variant_id_fkey',
            columns: ['variant_id'],
            isOneToOne: false,
            referencedRelation: 'product_variants',
            referencedColumns: ['id'],
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
        Relationships: [
          {
            foreignKeyName: 'discounts_created_by_fkey',
            columns: ['created_by'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'tax_rates_created_by_fkey',
            columns: ['created_by'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
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
    };
    Enums: {
      user_role: UserRole;
      customer_status: CustomerStatus;
      product_status: ProductStatus;
      variant_status: VariantStatus;
      plan_status: PlanStatus;
      billing_interval: BillingInterval;
      discount_type: DiscountType;
    };
  };
}

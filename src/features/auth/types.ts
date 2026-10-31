import type { User } from '@supabase/supabase-js';
import type { Database, UserRole } from '@/types/database.types';

export type { UserRole };

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

export interface AuthUserWithProfile {
  user: User | null;
  profile: Profile | null;
}

export type AppModule =
  | 'dashboard'
  | 'customers'
  | 'products'
  | 'plans'
  | 'subscriptions'
  | 'invoices'
  | 'payments'
  | 'reports'
  | 'settings';

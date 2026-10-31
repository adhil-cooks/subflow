/**
 * Customer domain types.
 *
 * These mirror the agreed contract for `public.customers` documented by
 * Arrow (the database owner). They are feature-local for now because
 * `@/types/database.types` is not on `main` yet.
 *
 * Once that file lands, `Customer` should become:
 *
 *   type Customer = Database["public"]["Tables"]["customers"]["Row"]
 *
 * so the database stays the single source of truth. Nothing else in the
 * feature should need to change.
 */

export const CUSTOMER_STATUSES = ["active", "inactive", "archived"] as const

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

/** Shape stored in the `billing_address` / `shipping_address` jsonb columns. */
export type Address = {
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export type Customer = {
  id: string
  profile_id: string | null
  name: string
  email: string
  phone: string | null
  company: string | null
  billing_address: Address
  shipping_address: Address
  status: CustomerStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

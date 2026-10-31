/**
 * Customer domain types.
 *
 * The database contract lives in `@/types/database.types` (owned by Arrow).
 * Everything here derives from it so there is a single source of truth.
 */

import type {
  CustomerStatus,
  Database,
  Json,
} from "@/types/database.types"

export type { CustomerStatus }

export type Customer = Database["public"]["Tables"]["customers"]["Row"]
export type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"]
export type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"]

/**
 * Iteration order for status dropdowns and filters.
 * `satisfies` keeps this in sync with the database enum at compile time.
 */
export const CUSTOMER_STATUSES = [
  "active",
  "inactive",
  "archived",
] as const satisfies readonly CustomerStatus[]

export function isCustomerStatus(value: unknown): value is CustomerStatus {
  return (
    typeof value === "string" &&
    (CUSTOMER_STATUSES as readonly string[]).includes(value)
  )
}

/** Shape stored in the `billing_address` / `shipping_address` jsonb columns. */
export type Address = {
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

function readAddressField(
  source: Record<string, Json | undefined>,
  key: keyof Address
): string | undefined {
  const value = source[key]

  return typeof value === "string" && value.trim() !== "" ? value : undefined
}

/**
 * Narrows a jsonb column to `Address`.
 *
 * The generated row type declares these columns as `Json`, and the database
 * defaults them to `{}`, so the value may legitimately be empty or malformed.
 */
export function toAddress(value: Json | null | undefined): Address {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  const source = value as Record<string, Json | undefined>

  return {
    line1: readAddressField(source, "line1"),
    line2: readAddressField(source, "line2"),
    city: readAddressField(source, "city"),
    state: readAddressField(source, "state"),
    postal_code: readAddressField(source, "postal_code"),
    country: readAddressField(source, "country"),
  }
}

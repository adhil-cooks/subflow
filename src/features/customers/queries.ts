import { createClient } from "@/lib/supabase/server"

import type { Customer, CustomerStatus } from "./types"

/**
 * Initial list size agreed with Arrow. Pagination via `.range()` is a
 * follow-up; the query is already ordered so it can be added safely.
 */
export const CUSTOMER_PAGE_SIZE = 50

export type CustomerListFilters = {
  q?: string
  status?: CustomerStatus
}

/**
 * PostgREST `.or()` uses commas and parentheses as syntax, so user input is
 * stripped of them before being interpolated.
 */
function sanitizeSearchTerm(value: string) {
  return value.replace(/[,()%]/g, " ").trim().slice(0, 100)
}

export async function listCustomers({
  q,
  status,
}: CustomerListFilters = {}): Promise<Customer[]> {
  const supabase = await createClient()

  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(CUSTOMER_PAGE_SIZE)

  const search = q ? sanitizeSearchTerm(q) : ""

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to load customers: ${error.message}`)
  }

  return data ?? []
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load customer: ${error.message}`)
  }

  return data
}

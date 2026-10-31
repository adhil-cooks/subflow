"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

import { parseCustomerForm, toFieldErrors, type CustomerFormState } from "./schema"

const UNAUTHENTICATED: CustomerFormState = {
  status: "error",
  message: "You need to sign in to manage customers.",
}

const UNEXPECTED: CustomerFormState = {
  status: "error",
  message: "Something went wrong while saving the customer. Please try again.",
}

/**
 * Server Actions must verify the session themselves — the Next.js docs are
 * explicit that hiding UI is not authorization. Row Level Security is the
 * second line of defence.
 */
async function getAuthenticatedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const { supabase, user } = await getAuthenticatedClient()

  if (!user) {
    return UNAUTHENTICATED
  }

  const parsed = parseCustomerForm(formData)

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    }
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({ ...parsed.data, created_by: user.id })
    .select("id")
    .single()

  if (error || !data) {
    return {
      status: "error",
      message: error?.message ?? UNEXPECTED.message,
    }
  }

  revalidatePath("/customers")
  redirect(`/customers/${data.id}`)
}

export async function updateCustomer(
  id: string,
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const { supabase, user } = await getAuthenticatedClient()

  if (!user) {
    return UNAUTHENTICATED
  }

  const parsed = parseCustomerForm(formData)

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    }
  }

  const { error } = await supabase
    .from("customers")
    .update(parsed.data)
    .eq("id", id)

  if (error) {
    return {
      status: "error",
      message: error.message,
    }
  }

  revalidatePath("/customers")
  revalidatePath(`/customers/${id}`)
  redirect(`/customers/${id}`)
}

/**
 * Customers are never hard-deleted: historical invoices and subscriptions
 * reference them with ON DELETE RESTRICT, so "delete" means archive.
 */
export async function archiveCustomer(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "")

  if (!id) {
    throw new Error("Missing customer id.")
  }

  const { supabase, user } = await getAuthenticatedClient()

  if (!user) {
    throw new Error("You need to sign in to manage customers.")
  }

  const { error } = await supabase
    .from("customers")
    .update({ status: "archived" })
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to archive customer: ${error.message}`)
  }

  revalidatePath("/customers")
  revalidatePath(`/customers/${id}`)
  redirect(`/customers/${id}`)
}

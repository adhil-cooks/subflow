import { z } from "zod"

import { CUSTOMER_STATUSES } from "./types"

/**
 * Empty inputs arrive from `FormData` as `""`. Treat them as "not provided"
 * so optional database columns are stored as `null` instead of empty strings.
 */
function optionalText(max: number, label: string) {
  return z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z
      .string()
      .trim()
      .max(max, `${label} must be ${max} characters or fewer`)
      .optional()
  )
}

export const customerStatusSchema = z.enum(CUSTOMER_STATUSES)

export const addressSchema = z.object({
  line1: optionalText(120, "Address line 1"),
  line2: optionalText(120, "Address line 2"),
  city: optionalText(80, "City"),
  state: optionalText(80, "State"),
  postal_code: optionalText(20, "Postal code"),
  country: optionalText(80, "Country"),
})

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email must be 254 characters or fewer")
    .pipe(z.email("Enter a valid email address")),
  phone: optionalText(30, "Phone"),
  company: optionalText(120, "Company"),
  status: customerStatusSchema,
  billing_address: addressSchema,
  shipping_address: addressSchema,
})

export type CustomerInput = z.infer<typeof customerSchema>

/** Values accepted by the form, before validation. */
export type CustomerFormValues = {
  name?: string
  email?: string
  phone?: string
  company?: string
  status?: z.infer<typeof customerStatusSchema>
  billing?: Partial<Record<keyof typeof addressSchema.shape, string>>
  shipping?: Partial<Record<keyof typeof addressSchema.shape, string>>
  sameAsBilling?: boolean
}

/**
 * Result returned by the create/update Server Actions.
 * `fieldErrors` is keyed by the input `name` so the form can wire
 * `aria-describedby` without a lookup table.
 */
export type CustomerFormState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Record<string, string>
}

export const initialCustomerFormState: CustomerFormState = { status: "idle" }

export type CustomerFormAction = (
  state: CustomerFormState,
  formData: FormData
) => Promise<CustomerFormState>

const ADDRESS_FIELDS = [
  "line1",
  "line2",
  "city",
  "state",
  "postal_code",
  "country",
] as const

function readAddress(formData: FormData, prefix: "billing" | "shipping") {
  const address: Record<string, FormDataEntryValue | null> = {}

  for (const field of ADDRESS_FIELDS) {
    address[field] = formData.get(`${prefix}_${field}`) ?? ""
  }

  return address
}

/**
 * Reads the customer form into a validated input object.
 *
 * Pure on purpose: the Server Action only has to call this, persist the
 * result and map database errors. When "same as billing" is checked, the
 * shipping address mirrors the billing address.
 */
export function parseCustomerForm(formData: FormData) {
  const billing = readAddress(formData, "billing")
  const sameAsBilling = formData.get("same_as_billing") === "on"

  return customerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    status: formData.get("status"),
    billing_address: billing,
    shipping_address: sameAsBilling
      ? billing
      : readAddress(formData, "shipping"),
  })
}

/** Maps Zod issues to the `name`-keyed shape the form expects. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}

  for (const issue of error.issues) {
    const [root, child] = issue.path
    const key =
      root === "billing_address" || root === "shipping_address"
        ? `${root === "billing_address" ? "billing" : "shipping"}_${String(child)}`
        : String(root)

    // Keep the first message per field; later ones are usually noise.
    fieldErrors[key] ??= issue.message
  }

  return fieldErrors
}

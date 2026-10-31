"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  initialCustomerFormState,
  type CustomerFormAction,
  type CustomerFormValues,
} from "../schema"
import { CUSTOMER_STATUSES, type CustomerStatus } from "../types"

const STATUS_LABELS: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
}

const ADDRESS_FIELDS = [
  { name: "line1", label: "Address line 1", autoComplete: "address-line1" },
  { name: "line2", label: "Address line 2", autoComplete: "address-line2" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State / Province", autoComplete: "address-level1" },
  { name: "postal_code", label: "Postal code", autoComplete: "postal-code" },
  { name: "country", label: "Country", autoComplete: "country-name" },
] as const

type AddressValues = CustomerFormValues["billing"]

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null

  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  )
}

function AddressFields({
  legend,
  prefix,
  values,
  errors,
  disabled = false,
}: {
  legend: string
  prefix: "billing" | "shipping"
  values?: AddressValues
  errors?: Record<string, string>
  disabled?: boolean
}) {
  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {ADDRESS_FIELDS.map((field) => {
          const name = `${prefix}_${field.name}`
          const error = errors?.[name]

          return (
            <div
              key={name}
              className={
                field.name === "line1" || field.name === "line2"
                  ? "space-y-2 sm:col-span-2"
                  : "space-y-2"
              }
            >
              <Label htmlFor={name}>{field.label}</Label>
              <Input
                id={name}
                name={name}
                defaultValue={values?.[field.name] ?? ""}
                autoComplete={field.autoComplete}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${name}-error` : undefined}
              />
              <FieldError id={`${name}-error`} message={error} />
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

export function CustomerForm({
  action,
  defaults,
  submitLabel = "Save customer",
  cancelHref,
}: {
  action: CustomerFormAction
  defaults?: CustomerFormValues
  submitLabel?: string
  cancelHref: string
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialCustomerFormState
  )
  const [sameAsBilling, setSameAsBilling] = useState(
    defaults?.sameAsBilling ?? false
  )
  const errors = state.fieldErrors

  return (
    <form action={formAction} noValidate className="space-y-8">
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          {state.status === "error" ? (
            <AlertCircle aria-hidden="true" />
          ) : (
            <CheckCircle2 aria-hidden="true" />
          )}
          <AlertTitle>
            {state.status === "error" ? "Could not save customer" : "Saved"}
          </AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">Contact details</h2>
          <p className="text-sm text-muted-foreground">
            Name and email are required. Email is not unique, so duplicate
            addresses are allowed for separate billing accounts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaults?.name ?? ""}
              autoComplete="name"
              aria-invalid={Boolean(errors?.name)}
              aria-describedby={errors?.name ? "name-error" : undefined}
            />
            <FieldError id="name-error" message={errors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={defaults?.email ?? ""}
              autoComplete="email"
              aria-invalid={Boolean(errors?.email)}
              aria-describedby={errors?.email ? "email-error" : undefined}
            />
            <FieldError id="email-error" message={errors?.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={defaults?.phone ?? ""}
              autoComplete="tel"
              aria-invalid={Boolean(errors?.phone)}
              aria-describedby={errors?.phone ? "phone-error" : undefined}
            />
            <FieldError id="phone-error" message={errors?.phone} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              defaultValue={defaults?.company ?? ""}
              autoComplete="organization"
              aria-invalid={Boolean(errors?.company)}
              aria-describedby={errors?.company ? "company-error" : undefined}
            />
            <FieldError id="company-error" message={errors?.company} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              items={STATUS_LABELS}
              defaultValue={defaults?.status ?? "active"}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError id="status-error" message={errors?.status} />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <AddressFields
          legend="Billing address"
          prefix="billing"
          values={defaults?.billing}
          errors={errors}
        />
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Shipping address</h2>
          <div className="flex items-center gap-2">
            <input
              id="same_as_billing"
              name="same_as_billing"
              type="checkbox"
              checked={sameAsBilling}
              onChange={(event) => setSameAsBilling(event.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            <Label htmlFor="same_as_billing" className="font-normal">
              Same as billing address
            </Label>
          </div>
        </div>

        <AddressFields
          legend="Shipping address details"
          prefix="shipping"
          values={defaults?.shipping}
          errors={errors}
          disabled={sameAsBilling}
        />
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
        <Button variant="outline" render={<Link href={cancelHref} />}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}

import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"

import { updateCustomer } from "@/features/customers/actions"
import { CustomerForm } from "@/features/customers/components/customer-form"
import { getCustomer } from "@/features/customers/queries"
import { toAddress, type Address, type Customer } from "@/features/customers/types"

export const metadata = {
  title: "Edit customer",
}

/** Same shell limitation as `/customers/[id]` — see that page for context. */
export const instant = false

type EditCustomerPageProps = {
  params: Promise<{ id: string }>
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  return (
    <div className="space-y-8 pb-10">
      <Suspense fallback={<EditCustomerSkeleton />}>
        <EditCustomerContent params={params} />
      </Suspense>
    </div>
  )
}

function normalizeAddress(address: Address) {
  return {
    line1: address.line1 ?? "",
    line2: address.line2 ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    postal_code: address.postal_code ?? "",
    country: address.country ?? "",
  }
}

function addressesEqual(a: Address, b: Address) {
  return JSON.stringify(normalizeAddress(a)) === JSON.stringify(normalizeAddress(b))
}

function hasAddress(address: Address) {
  return Object.values(normalizeAddress(address)).some((value) => value.length > 0)
}

function toFormDefaults(customer: Customer) {
  const billing = toAddress(customer.billing_address)
  const shipping = toAddress(customer.shipping_address)
  const sameAsBilling = hasAddress(billing) && addressesEqual(billing, shipping)

  return {
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? undefined,
    company: customer.company ?? undefined,
    status: customer.status,
    billing,
    shipping: sameAsBilling ? undefined : shipping,
    sameAsBilling,
  }
}

async function EditCustomerContent({ params }: EditCustomerPageProps) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  return (
    <>
      <div>
        <Link
          href={`/customers/${customer.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to customer
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Edit customer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update contact details, addresses and status for {customer.name}.
        </p>
      </div>

      <CustomerForm
        action={updateCustomer.bind(null, customer.id)}
        defaults={toFormDefaults(customer)}
        submitLabel="Save changes"
        cancelHref={`/customers/${customer.id}`}
      />
    </>
  )
}

function EditCustomerSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </>
  )
}

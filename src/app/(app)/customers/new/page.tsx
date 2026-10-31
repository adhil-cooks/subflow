import Link from "next/link"

import { CustomerForm } from "@/features/customers/components/customer-form"
import { createCustomer } from "@/features/customers/actions"

export const metadata = {
  title: "New customer",
}

export default function NewCustomerPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <Link
          href="/customers"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to customers
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          New customer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only the name and email are required. Address details can be added
          later.
        </p>
      </div>

      <CustomerForm
        action={createCustomer}
        submitLabel="Create customer"
        cancelHref="/customers"
      />
    </div>
  )
}

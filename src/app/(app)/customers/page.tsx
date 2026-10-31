import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"

import { Button } from "@/components/ui/button"

import { CustomersEmptyState } from "@/features/customers/components/customers-empty-state"
import { CustomersFilterBar } from "@/features/customers/components/customers-filter-bar"
import { CustomersTable } from "@/features/customers/components/customers-table"
import { CustomersTableSkeleton } from "@/features/customers/components/customers-table-skeleton"
import { listCustomers } from "@/features/customers/queries"
import { isCustomerStatus, type CustomerStatus } from "@/features/customers/types"

export const metadata = {
  title: "Customers",
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Customers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer records, contact details and billing information.
          </p>
        </div>

        <Button render={<Link href="/customers/new" />}>New customer</Button>
      </div>

      <Suspense fallback={<CustomersTableSkeleton />}>
        <CustomersContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function CustomersContent({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  // Supabase reads the session cookie, which computes an expiry with
  // `Date.now()`; make the request-time boundary explicit for PPR.
  await connection()

  const q = typeof params.q === "string" ? params.q.trim() : ""
  const statusParam = typeof params.status === "string" ? params.status : "all"
  const status: CustomerStatus | undefined = isCustomerStatus(statusParam)
    ? statusParam
    : undefined

  const customers = await listCustomers({ q, status })
  const isFiltered = q.length > 0 || status !== undefined

  return (
    <div className="space-y-4">
      <CustomersFilterBar q={q} status={status ?? "all"} />

      {customers.length === 0 ? (
        <CustomersEmptyState
          title={isFiltered ? "No customers match your filters" : "No customers yet"}
          description={
            isFiltered
              ? "Try a different search term or status."
              : "Create your first customer to start tracking subscriptions and invoices."
          }
          action={
            isFiltered ? undefined : (
              <Button render={<Link href="/customers/new" />}>
                New customer
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <CustomersTable customers={customers} />
        </div>
      )}
    </div>
  )
}

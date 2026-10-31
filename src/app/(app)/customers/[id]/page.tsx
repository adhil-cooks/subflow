import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { archiveCustomer } from "@/features/customers/actions"
import { ArchiveCustomerButton } from "@/features/customers/components/archive-customer-button"
import { CustomerDetailCard } from "@/features/customers/components/customer-detail-card"
import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge"
import { getCustomer } from "@/features/customers/queries"

export const metadata = {
  title: "Customer",
}

/**
 * The app shell's sidebar reads `usePathname()` outside a `<Suspense>` boundary,
 * which prevents prerendering a static shell for dynamic routes. Until the shell
 * wraps that hook, this segment is marked as allowed to block.
 */
export const instant = false

type CustomerPageProps = {
  params: Promise<{ id: string }>
}

export default function CustomerDetailPage({ params }: CustomerPageProps) {
  return (
    <div className="space-y-8 pb-10">
      <Suspense fallback={<CustomerDetailSkeleton />}>
        <CustomerDetailContent params={params} />
      </Suspense>
    </div>
  )
}

async function CustomerDetailContent({ params }: CustomerPageProps) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/customers"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to customers
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {customer.name}
            </h1>
            <CustomerStatusBadge status={customer.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{customer.email}</p>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          <Button
            variant="outline"
            render={<Link href={`/customers/${customer.id}/edit`} />}
          >
            Edit
          </Button>
          {customer.status === "archived" ? null : (
            <ArchiveCustomerButton
              customerId={customer.id}
              customerName={customer.name}
              action={archiveCustomer}
            />
          )}
        </div>
      </div>

      <CustomerDetailCard customer={customer} />
    </>
  )
}

function CustomerDetailSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-lg" />
        <Skeleton className="h-52 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg lg:col-span-2" />
      </div>
    </>
  )
}

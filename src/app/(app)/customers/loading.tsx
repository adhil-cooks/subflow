import { Skeleton } from "@/components/ui/skeleton"

import { CustomersTableSkeleton } from "@/features/customers/components/customers-table-skeleton"

export default function CustomersLoading() {
  return (
    <div className="space-y-8 pb-10">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <CustomersTableSkeleton />
    </div>
  )
}

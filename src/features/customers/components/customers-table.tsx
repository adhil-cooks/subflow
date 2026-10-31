import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Customer, CustomerStatus } from "../types"

/**
 * Temporary status rendering until Adhil's `@/components/shared/status-badge`
 * lands. Kept neutral on purpose: semantic status colours belong to that
 * shared component, not to this table.
 */
const STATUS_VARIANTS: Record<
  CustomerStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  inactive: "secondary",
  archived: "outline",
}

const STATUS_LABELS: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })

function formatDate(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date)
}

export function CustomersTable({ customers }: { customers: Customer[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Company</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">
              <Link
                href={`/customers/${customer.id}`}
                className="underline-offset-4 hover:underline"
              >
                {customer.name}
              </Link>
            </TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">
              {customer.company ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {customer.email}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANTS[customer.status]}>
                {STATUS_LABELS[customer.status]}
              </Badge>
            </TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {formatDate(customer.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

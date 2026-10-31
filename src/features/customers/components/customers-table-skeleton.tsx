import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const COLUMNS = [
  { label: "Name" },
  { label: "Company", className: "hidden md:table-cell" },
  { label: "Email" },
  { label: "Status" },
  { label: "Created", className: "hidden sm:table-cell" },
]

/** Mirrors the column layout of `CustomersTable` while data loads. */
export function CustomersTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Table aria-busy="true" aria-label="Loading customers">
      <TableHeader>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableHead key={column.label} className={column.className}>
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-4xl" />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="h-4 w-20" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

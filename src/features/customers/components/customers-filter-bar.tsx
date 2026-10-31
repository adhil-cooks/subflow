import Link from "next/link"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { type CustomerStatus } from "../types"

const STATUS_OPTIONS = {
  all: "All statuses",
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
} as const

type StatusFilter = keyof typeof STATUS_OPTIONS

/**
 * Plain GET form so filtering lives in the URL and survives refreshes,
 * sharing and back/forward navigation.
 */
export function CustomersFilterBar({
  q,
  status,
}: {
  q: string
  status: CustomerStatus | "all"
}) {
  const isFiltered = q.length > 0 || status !== "all"

  return (
    <form
      method="get"
      action="/customers"
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          aria-label="Search customers"
          className="pl-8"
        />
      </div>

      <Select
        name="status"
        items={STATUS_OPTIONS}
        defaultValue={status}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(STATUS_OPTIONS) as StatusFilter[]).map((value) => (
            <SelectItem key={value} value={value}>
              {STATUS_OPTIONS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" variant="outline">
        Filter
      </Button>

      {isFiltered ? (
        <Button variant="ghost" render={<Link href="/customers" />}>
          Reset
        </Button>
      ) : null}
    </form>
  )
}

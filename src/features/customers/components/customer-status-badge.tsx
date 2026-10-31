import { Badge } from "@/components/ui/badge"

import type { CustomerStatus } from "../types"

/**
 * Temporary local status badge until Adhil's
 * `@/components/shared/status-badge` lands. Neutral tones only — semantic
 * status colours belong to that shared component.
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

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  )
}

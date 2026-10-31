import type { ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { Address, Customer } from "../types"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatTimestamp(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date)
}

function AddressBlock({ address }: { address: Address | null }) {
  const lines = [
    address?.line1,
    address?.line2,
    [address?.city, address?.state, address?.postal_code]
      .filter(Boolean)
      .join(", "),
    address?.country,
  ].filter((line) => Boolean(line && line.trim().length > 0))

  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">Not provided</p>
  }

  return (
    <address className="text-sm not-italic">
      {lines.map((line, index) => (
        <span key={index} className="block">
          {line}
        </span>
      ))}
    </address>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-words">{value}</dd>
    </div>
  )
}

export function CustomerDetailCard({ customer }: { customer: Customer }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <DetailRow label="Name" value={customer.name} />
            <DetailRow
              label="Email"
              value={
                <a
                  href={`mailto:${customer.email}`}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {customer.email}
                </a>
              }
            />
            <DetailRow label="Phone" value={customer.phone ?? "—"} />
            <DetailRow label="Company" value={customer.company ?? "—"} />
            <DetailRow
              label="Portal access"
              value={customer.profile_id ? "Linked profile" : "Not linked"}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Billing</h3>
            <AddressBlock address={customer.billing_address} />
          </div>
          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="text-sm font-medium">Shipping</h3>
            <AddressBlock address={customer.shipping_address} />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Record</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <DetailRow
              label="Customer ID"
              value={<span className="font-mono text-xs">{customer.id}</span>}
            />
            <DetailRow
              label="Created"
              value={formatTimestamp(customer.created_at)}
            />
            <DetailRow
              label="Last updated"
              value={formatTimestamp(customer.updated_at)}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

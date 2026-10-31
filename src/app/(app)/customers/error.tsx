"use client"

import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function CustomersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Customers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage customer records, contact details and billing information.
        </p>
      </div>

      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Could not load customers</AlertTitle>
        <AlertDescription>
          {error.message || "Something went wrong while loading this page."}
        </AlertDescription>
      </Alert>

      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}

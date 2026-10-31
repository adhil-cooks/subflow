"use client"

import { useState } from "react"
import { Archive } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

/**
 * Archiving is the only "delete" the data model allows, so it asks for an
 * explicit confirmation instead of firing on the first click.
 */
export function ArchiveCustomerButton({
  customerId,
  customerName,
  action,
}: {
  customerId: string
  customerName: string
  action: (formData: FormData) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <Button variant="outline" onClick={() => setConfirming(true)}>
        <Archive aria-hidden="true" />
        Archive
      </Button>
    )
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={customerId} />
      <Alert variant="destructive">
        <Archive aria-hidden="true" />
        <AlertTitle>Archive {customerName}?</AlertTitle>
        <AlertDescription>
          The customer keeps their invoices and subscriptions, but they can no
          longer be selected for new ones.
        </AlertDescription>
      </Alert>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" size="sm">
          Yes, archive
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

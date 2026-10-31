import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function CustomerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Customer not found</h1>
        <p className="text-sm text-muted-foreground">
          This customer may have been removed, or the link is incorrect.
        </p>
      </div>
      <Button variant="outline" render={<Link href="/customers" />}>
        Back to customers
      </Button>
    </div>
  )
}

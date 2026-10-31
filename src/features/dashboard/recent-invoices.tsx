import { cn } from "@/lib/utils";
import type { RecentInvoice, InvoiceStatus } from "./mock-data";

const statusLabels: Record<InvoiceStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
};

const statusStyles: Record<InvoiceStatus, string> = {
  paid: "bg-green-500/10 text-green-500",
  pending: "bg-yellow-500/10 text-yellow-500",
  overdue: "bg-red-500/10 text-red-400",
};

interface RecentInvoicesProps {
  invoices: RecentInvoice[];
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-card-foreground">
          Recent Invoices
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Latest invoice activity (mock data)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Invoice
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Customer
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Due Date
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                  {inv.id}
                </td>
                <td className="px-5 py-3.5 font-medium text-card-foreground">
                  {inv.customer}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusStyles[inv.status]
                    )}
                  >
                    {statusLabels[inv.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                  {inv.dueDate}
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums font-medium text-card-foreground">
                  {inv.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


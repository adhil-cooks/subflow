import { cn } from "@/lib/utils";
import type { RecentSubscription, SubscriptionStatus } from "./mock-data";

const statusLabels: Record<SubscriptionStatus, string> = {
  active: "Active",
  trialing: "Trialing",
  canceled: "Canceled",
  past_due: "Past Due",
};

const statusStyles: Record<SubscriptionStatus, string> = {
  active: "bg-green-500/10 text-green-500",
  trialing: "bg-yellow-500/10 text-yellow-500",
  canceled: "bg-zinc-500/10 text-zinc-400",
  past_due: "bg-red-500/10 text-red-400",
};

interface RecentSubscriptionsProps {
  subscriptions: RecentSubscription[];
}

export function RecentSubscriptions({ subscriptions }: RecentSubscriptionsProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-card-foreground">
          Recent Subscriptions
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Latest subscription activity (mock data)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Customer
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Plan
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5 font-medium text-card-foreground">
                  {sub.customer}
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">
                  {sub.plan}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusStyles[sub.status]
                    )}
                  >
                    {statusLabels[sub.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-card-foreground">
                  {sub.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


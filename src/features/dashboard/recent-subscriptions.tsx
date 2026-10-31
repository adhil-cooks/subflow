import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RecentSubscription, SubscriptionStatus } from "./mock-data";

const statusLabels: Record<SubscriptionStatus, string> = {
  active: "Active",
  trialing: "Trialing",
  canceled: "Canceled",
  past_due: "Past Due",
};

const statusStyles: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  trialing: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  canceled: "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20",
  past_due: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
};

const statusDots: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-400",
  trialing: "bg-amber-400",
  canceled: "bg-zinc-400",
  past_due: "bg-rose-400",
};

interface RecentSubscriptionsProps {
  subscriptions: RecentSubscription[];
}

export function RecentSubscriptions({ subscriptions }: RecentSubscriptionsProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-card/60 transition-colors hover:border-border">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Recent Subscriptions
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Latest subscription activity (mock data)
          </p>
        </div>
        <Link
          href="/subscriptions"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <span>View all</span>
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/30 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-5 py-3 sm:px-6">
                Customer
              </th>
              <th scope="col" className="px-5 py-3 sm:px-6">
                Plan
              </th>
              <th scope="col" className="px-5 py-3 sm:px-6">
                Status
              </th>
              <th scope="col" className="px-5 py-3 text-right sm:px-6">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {subscriptions.map((sub) => (
              <tr
                key={sub.id}
                className="transition-colors hover:bg-muted/20"
              >
                <td className="px-5 py-3.5 font-medium text-foreground sm:px-6">
                  {sub.customer}
                </td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground sm:px-6">
                  {sub.plan}
                </td>
                <td className="px-5 py-3.5 sm:px-6">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusStyles[sub.status]
                    )}
                  >
                    <span
                      className={cn("size-1.5 rounded-full", statusDots[sub.status])}
                      aria-hidden="true"
                    />
                    {statusLabels[sub.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-medium tabular-nums text-foreground sm:px-6">
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

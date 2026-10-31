import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  FileText,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetricData } from "./mock-data";

interface MetricCardProps {
  metric: MetricData;
}

const metricIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Monthly Recurring Revenue": DollarSign,
  "Active Subscriptions": Users,
  "Invoices Outstanding": FileText,
  "New Customers": UserPlus,
};

export function MetricCard({ metric }: MetricCardProps) {
  const { label, value, change, trend } = metric;
  const Icon = metricIcons[label] ?? DollarSign;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-card/60 p-5 transition-colors hover:border-border sm:p-6">
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted/30 text-muted-foreground ring-1 ring-border/40">
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>

      {/* Main value */}
      <div className="mt-4 mb-2">
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
      </div>

      {/* Bottom row: Trend badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            trend === "up" && "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
            trend === "down" && "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
            trend === "neutral" && "bg-muted/40 text-muted-foreground ring-1 ring-border/40"
          )}
        >
          {trend === "up" && <TrendingUp className="size-3" aria-hidden="true" />}
          {trend === "down" && <TrendingDown className="size-3" aria-hidden="true" />}
          {trend === "neutral" && <Minus className="size-3" aria-hidden="true" />}
          <span>{change}</span>
        </span>
      </div>
    </div>
  );
}

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetricData } from "./mock-data";

interface MetricCardProps {
  metric: MetricData;
}

export function MetricCard({ metric }: MetricCardProps) {
  const { label, value, change, trend } = metric;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-card-foreground">
        {value}
      </p>
      <div
        className={cn(
          "mt-2 flex items-center gap-1 text-xs font-medium",
          trend === "up" && "text-green-500",
          trend === "down" && "text-red-400",
          trend === "neutral" && "text-muted-foreground"
        )}
      >
        {trend === "up" && <TrendingUp className="size-3.5" aria-hidden="true" />}
        {trend === "down" && <TrendingDown className="size-3.5" aria-hidden="true" />}
        {trend === "neutral" && <Minus className="size-3.5" aria-hidden="true" />}
        <span>{change}</span>
      </div>
    </div>
  );
}


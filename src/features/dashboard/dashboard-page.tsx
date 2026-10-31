import { Calendar, Download } from "lucide-react";
import { MetricCard } from "./metric-card";
import { RevenueChart } from "./revenue-chart";
import { RecentSubscriptions } from "./recent-subscriptions";
import { RecentInvoices } from "./recent-invoices";
import { Button } from "@/components/ui/button";
import {
  METRICS,
  REVENUE_DATA,
  RECENT_SUBSCRIPTIONS,
  RECENT_INVOICES,
} from "./mock-data";

/**
 * DashboardPage
 *
 * Polished, spacious SaaS overview displaying core subscription metrics,
 * revenue trajectory, and recent subscription/invoice activity.
 */
export function DashboardPage() {
  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A comprehensive snapshot of your recurring revenue and subscription health.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Calendar className="size-3.5" aria-hidden="true" />
            <span>Last 30 days</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-border/60 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="size-3.5" aria-hidden="true" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <section aria-label="Key Metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      {/* Revenue Performance Chart */}
      <section aria-label="Revenue Performance">
        <RevenueChart data={REVENUE_DATA} />
      </section>

      {/* Recent Activity: Subscriptions & Invoices */}
      <section aria-label="Recent Activity">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentSubscriptions subscriptions={RECENT_SUBSCRIPTIONS} />
          <RecentInvoices invoices={RECENT_INVOICES} />
        </div>
      </section>
    </div>
  );
}

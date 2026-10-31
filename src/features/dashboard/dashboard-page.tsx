import { MetricCard } from "./metric-card";
import { RevenueChart } from "./revenue-chart";
import { RecentSubscriptions } from "./recent-subscriptions";
import { RecentInvoices } from "./recent-invoices";
import {
  METRICS,
  REVENUE_DATA,
  RECENT_SUBSCRIPTIONS,
  RECENT_INVOICES,
} from "./mock-data";

/**
 * DashboardPage
 *
 * Composes all dashboard sections using mock data.
 * Swap mock imports for real server data once the Supabase layer is ready.
 */
export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A summary of your subscription business.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {/* Revenue chart */}
      <RevenueChart data={REVENUE_DATA} />

      {/* Recent activity — two-column on large screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentSubscriptions subscriptions={RECENT_SUBSCRIPTIONS} />
        <RecentInvoices invoices={RECENT_INVOICES} />
      </div>
    </div>
  );
}


"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueDataPoint } from "./mock-data";

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

function formatCurrency(value: number) {
  return `$${(value / 1000).toFixed(0)}k`;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const latestRevenue = data[data.length - 1]?.revenue ?? 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-5 transition-colors hover:border-border sm:p-6">
      {/* Header with Title and Current Value */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Revenue Overview
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Monthly recurring revenue trajectory (mock data)
          </p>
        </div>

        {/* Legend / Current Stat */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-foreground" aria-hidden="true" />
            <span>MRR</span>
          </div>
          <div className="rounded-md bg-muted/40 px-2 py-0.5 font-semibold text-foreground ring-1 ring-border/40">
            ${latestRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6 h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="oklch(0.95 0 0)"
                  stopOpacity={0.16}
                />
                <stop
                  offset="100%"
                  stopColor="oklch(0.95 0 0)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="oklch(1 0 0 / 6%)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "oklch(0.65 0 0)" }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 11, fill: "oklch(0.65 0 0)" }}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <Tooltip
              formatter={(value) => {
                if (typeof value !== "number") return [String(value), "Revenue"];
                return [`$${value.toLocaleString()}`, "Revenue"];
              }}
              contentStyle={{
                backgroundColor: "oklch(0.20 0 0)",
                border: "1px solid oklch(1 0 0 / 12%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "oklch(0.985 0 0)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
              cursor={{ stroke: "oklch(1 0 0 / 15%)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="oklch(0.95 0 0)"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{
                r: 4.5,
                fill: "oklch(0.985 0 0)",
                stroke: "oklch(0.145 0 0)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

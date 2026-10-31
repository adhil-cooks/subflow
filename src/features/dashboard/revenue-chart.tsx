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
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">
        Revenue Overview
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Monthly recurring revenue — last 6 months (mock data)
      </p>

      <div className="mt-4 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="oklch(0.87 0 0)"
                  stopOpacity={0.15}
                />
                <stop
                  offset="95%"
                  stopColor="oklch(0.87 0 0)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(1 0 0 / 8%)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "oklch(0.708 0 0)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 11, fill: "oklch(0.708 0 0)" }}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip
              formatter={(value) => {
                if (typeof value !== "number") return [String(value), "Revenue"];
                return [`$${value.toLocaleString()}`, "Revenue"];
              }}
              contentStyle={{
                backgroundColor: "oklch(0.205 0 0)",
                border: "1px solid oklch(1 0 0 / 10%)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "oklch(0.985 0 0)",
              }}
              cursor={{ stroke: "oklch(0.708 0 0)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="oklch(0.87 0 0)"
              strokeWidth={1.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "oklch(0.87 0 0)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

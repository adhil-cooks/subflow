"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { TableSkeleton } from "./table-skeleton";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";

export type ResponsiveBreakpoint = "sm" | "md" | "lg" | "xl";

export interface Column<T> {
  /** Unique key identifying the column */
  key: string;
  /** Header label or element */
  header: React.ReactNode;
  /** Cell rendering function receiving the current row data */
  cell: (row: T) => React.ReactNode;
  /** Optional custom CSS classes for cells in this column */
  className?: string;
  /** Responsive breakpoint below which the column is hidden */
  hideBelow?: ResponsiveBreakpoint;
}

export interface DataTableProps<T> {
  /** Array of column configurations */
  columns: Column<T>[];
  /** Array of row data */
  data: T[];
  /** Function returning a unique key for each row */
  rowKey: (row: T) => string | number;
  /** Optional function returning a destination URL for clickable rows */
  rowHref?: (row: T) => string;
  /** Custom empty state node rendered when data is empty */
  empty?: React.ReactNode;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Optional container class */
  className?: string;
}

const hideBelowClasses: Record<ResponsiveBreakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

/**
 * Reusable data table component.
 *
 * Integrates Table UI primitives, animated loading skeleton,
 * empty state, responsive column visibility, and optional row navigation.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  rowHref,
  empty,
  isLoading = false,
  className,
}: DataTableProps<T>) {
  const router = useRouter();

  // Loading state
  if (isLoading) {
    return (
      <TableSkeleton
        columns={columns.length}
        rows={5}
        className={className}
      />
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    if (empty) {
      return <>{empty}</>;
    }

    return (
      <EmptyState
        title="No records found"
        description="There are no items to display at this time."
        className={className}
      />
    );
  }

  const handleRowClick = (
    e: React.MouseEvent<HTMLTableRowElement>,
    row: T
  ) => {
    if (!rowHref) return;

    // Do not trigger row navigation if user clicked a link, button, or input inside the row
    const target = e.target as HTMLElement | null;
    if (target?.closest("a, button, [role='button'], input, select, textarea")) {
      return;
    }

    router.push(rowHref(row));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTableRowElement>,
    row: T
  ) => {
    if (!rowHref) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(rowHref(row));
    }
  };

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border/60 bg-card/60 transition-colors hover:border-border",
        className
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
                  col.hideBelow && hideBelowClasses[col.hideBelow],
                  col.className
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/20">
          {data.map((row) => {
            const key = rowKey(row);
            const isClickable = Boolean(rowHref);

            return (
              <TableRow
                key={key}
                tabIndex={isClickable ? 0 : undefined}
                role={isClickable ? "link" : undefined}
                onClick={(e) => handleRowClick(e, row)}
                onKeyDown={(e) => handleKeyDown(e, row)}
                className={cn(
                  "border-border/20 transition-colors hover:bg-muted/30",
                  isClickable && "cursor-pointer focus-visible:bg-muted/40 focus-visible:outline-none"
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={`${key}-${col.key}`}
                    className={cn(
                      "p-3.5 text-sm text-foreground",
                      col.hideBelow && hideBelowClasses[col.hideBelow],
                      col.className
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

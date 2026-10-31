import React from "react";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  /** Composable filter controls (e.g. search input, select dropdowns) driven by URL parameters */
  children?: React.ReactNode;
  /** Optional action buttons (e.g. create button, export button) */
  actions?: React.ReactNode;
  /** Optional container class */
  className?: string;
}

/**
 * Reusable filter toolbar component.
 *
 * Provides a responsive layout container for URL-driven search and filter controls
 * on the left, and secondary action buttons on the right.
 */
export function FilterBar({ children, actions, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Left side: Composable filter controls */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {children}
      </div>

      {/* Right side: Action controls */}
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

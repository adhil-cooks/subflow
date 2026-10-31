import React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  /** The primary title of the page */
  title: React.ReactNode;
  /** Optional secondary explanatory text */
  description?: React.ReactNode;
  /** Optional action area (e.g. primary buttons, date filters, controls) */
  actions?: React.ReactNode;
  /** Optional container CSS class */
  className?: string;
}

/**
 * Reusable page header component.
 *
 * Provides a consistent page title, optional description,
 * and an action toolbar across all Subflow feature pages.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}

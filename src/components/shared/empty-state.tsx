import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Optional icon component (defaults to Inbox) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Primary message title */
  title: string;
  /** Explanatory description */
  description?: string;
  /** Optional primary action (e.g. Button or link) */
  action?: React.ReactNode;
  /** Optional container class */
  className?: string;
}

/**
 * Reusable empty state placeholder.
 *
 * Renders an accessible, centered empty state container with an icon,
 * descriptive text, and an optional action slot.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 px-6 py-12 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/30 text-muted-foreground ring-1 ring-border/40">
        <Icon className="size-6" aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {action && <div className="mt-6 flex items-center justify-center">{action}</div>}
    </div>
  );
}

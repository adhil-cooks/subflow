import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

export interface StatusBadgeProps {
  /** The text displayed inside the badge */
  label: string;
  /** Semantic color tone */
  tone: StatusTone;
  /** Optional custom CSS class */
  className?: string;
}

const toneStyles: Record<StatusTone, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  neutral: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const dotStyles: Record<StatusTone, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-rose-400",
  neutral: "bg-zinc-400",
};

/**
 * Maps common Subflow status keys to their semantic tone.
 */
export function getStatusTone(status: string): StatusTone {
  const normalized = status.toLowerCase().replace(/[\s-]+/g, "_");
  switch (normalized) {
    case "active":
    case "paid":
      return "success";
    case "trialing":
    case "pending":
      return "warning";
    case "past_due":
    case "overdue":
    case "failed":
      return "danger";
    case "canceled":
    case "draft":
    case "inactive":
    default:
      return "neutral";
  }
}

/**
 * Reusable status indicator badge.
 *
 * Wraps the Badge UI primitive with a semantic dot and consistent
 * dark-first Subflow tones (success, warning, danger, neutral).
 */
export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
        toneStyles[tone],
        className
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", dotStyles[tone])}
        aria-hidden="true"
      />
      <span>{label}</span>
    </Badge>
  );
}

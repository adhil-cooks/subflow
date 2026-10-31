import { Search, Bell, SlidersHorizontal, Plus } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";

/**
 * Top application header.
 *
 * Provides:
 * - Mobile navigation trigger for small screens.
 * - Global search input with shortcut hint.
 * - Quick action toolbar (Filters, Notifications, New Subscription).
 * - Placeholder for user profile integration.
 */
export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/50 bg-background/95 px-4 backdrop-blur-xs md:px-8">
      {/* Left: Mobile Nav + Search */}
      <div className="flex flex-1 items-center gap-3">
        {/* Mobile menu trigger */}
        <MobileNav />

        {/* Mobile brand title */}
        <span className="text-sm font-semibold tracking-tight text-foreground md:hidden">
          Subflow
        </span>

        {/* Desktop search bar */}
        <div className="relative hidden w-full max-w-sm sm:block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search subscriptions, customers, invoices..."
            className="h-9 w-full rounded-lg border border-border/60 bg-muted/20 pl-9 pr-10 text-xs text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-ring focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions toolbar */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-1.5 border-border/60 text-xs text-muted-foreground hover:text-foreground md:inline-flex"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          <span>Filters</span>
        </Button>

        {/* Notification indicator */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="View notifications"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="size-4" aria-hidden="true" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
        </Button>

        {/* Primary CTA */}
        <Button
          size="sm"
          className="gap-1.5 text-xs font-medium shadow-xs"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">New Subscription</span>
          <span className="sm:hidden">New</span>
        </Button>

        {/* User avatar indicator */}
        <div className="ml-1 flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground ring-1 ring-border/60">
          A
        </div>
      </div>
    </header>
  );
}

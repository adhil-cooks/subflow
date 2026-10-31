import { MobileNav } from "./mobile-nav";

/**
 * Top application header.
 * Contains the mobile nav trigger on small screens and a slot for future
 * header actions (user menu, notifications, etc.).
 */
export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      {/* Mobile navigation trigger (renders on small screens only) */}
      <MobileNav />

      {/* App name shown on mobile where the sidebar is hidden */}
      <span className="text-sm font-semibold tracking-tight text-foreground md:hidden">
        Subflow
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Future: user avatar, notifications, etc. */}
    </header>
  );
}


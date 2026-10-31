"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  RefreshCw,
  FileText,
  CreditCard,
  Tag,
  Settings,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Products", href: "/products", icon: Package },
  { label: "Plans", href: "/plans", icon: Layers },
  { label: "Subscriptions", href: "/subscriptions", icon: RefreshCw },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Discounts", href: "/discounts", icon: Tag },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

interface SidebarProps {
  onNavClick?: () => void;
}

/**
 * Pathname-dependent navigation list.
 * Reads usePathname() to apply active route highlighting.
 */
function SidebarNav({ onNavClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main Navigation">
      <ul className="space-y-1" role="list">
        {mainNavItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavClick}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/[0.08] text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground/80 group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Static fallback for sidebar navigation.
 * Renders the same navigation items with default inactive styling during
 * prerendering or while URL data resolves, preventing layout shift.
 */
function SidebarNavFallback({ onNavClick }: SidebarProps) {
  return (
    <nav aria-label="Main Navigation">
      <ul className="space-y-1" role="list">
        {mainNavItems.map(({ label, href, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavClick}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
            >
              <Icon
                className="size-4 shrink-0 text-muted-foreground/80 transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Application Sidebar.
 *
 * Keeps static brand header, section label, and account footer outside of Suspense.
 * Wraps the pathname-dependent navigation list in React.Suspense to comply with
 * Next.js cacheComponents prerendering rules.
 */
export function Sidebar({ onNavClick }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/60 bg-sidebar/95 backdrop-blur-xs select-none">
      {/* Brand & Workspace — Outside Suspense */}
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-5">
        <Link
          href="/"
          onClick={onNavClick}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Sparkles className="size-4 fill-current" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Subflow
            </span>
            <span className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
              Workspace
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4">
        <div className="mb-2 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Navigation
        </div>
        <Suspense fallback={<SidebarNavFallback onNavClick={onNavClick} />}>
          <SidebarNav onNavClick={onNavClick} />
        </Suspense>
      </div>

      {/* Account / Workspace Footer — Outside Suspense */}
      <div className="border-t border-border/50 p-3">
        <div className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-white/[0.04]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground ring-1 ring-border/50">
              AC
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                Acme Corp
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Admin
              </p>
            </div>
          </div>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}

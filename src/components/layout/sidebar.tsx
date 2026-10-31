"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
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

export function Sidebar({ onNavClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-5">
        <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
          Subflow
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5" role="list">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavClick}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}


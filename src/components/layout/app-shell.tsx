import { Sidebar } from "./sidebar";
import { Header } from "./header";

/**
 * Application shell layout.
 *
 * Usage — in a Next.js App Router layout file:
 *
 * ```tsx
 * import { AppShell } from "@/components/layout/app-shell";
 *
 * export default function Layout({ children }: { children: React.ReactNode }) {
 *   return <AppShell>{children}</AppShell>;
 * }
 * ```
 *
 * The shell provides:
 * - A fixed left sidebar on desktop.
 * - A slide-in mobile drawer (via Header → MobileNav).
 * - A sticky top header.
 * - A scrollable main content area.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Right column: header + content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}


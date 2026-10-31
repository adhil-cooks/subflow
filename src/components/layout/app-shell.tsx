import { Sidebar } from "./sidebar";
import { Header } from "./header";

/**
 * Application shell layout.
 *
 * Provides:
 * - Fixed left sidebar on desktop.
 * - Mobile slide-in drawer.
 * - Sticky top header with global actions.
 * - Spacious, scrollable main content area.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground antialiased">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 md:py-8 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

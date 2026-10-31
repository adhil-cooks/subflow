import { AppShell } from "@/components/layout/app-shell";

/**
 * Application layout — wraps all authenticated application pages.
 *
 * This is an App Router route group layout (`(app)`).
 * The route group does not affect the URL structure.
 *
 * Teammates: to add a new page inside the application shell, create a
 * `page.tsx` file inside `src/app/(app)/your-feature/` and it will
 * automatically be wrapped in this layout.
 *
 * Example:
 *   src/app/(app)/customers/page.tsx  →  /customers
 *   src/app/(app)/invoices/page.tsx   →  /invoices
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

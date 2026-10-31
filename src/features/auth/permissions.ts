import type { AppModule, UserRole } from './types';

const ROLE_PERMISSIONS: Record<UserRole, AppModule[]> = {
  admin: [
    'dashboard',
    'customers',
    'products',
    'plans',
    'subscriptions',
    'invoices',
    'payments',
    'reports',
    'settings',
  ],
  staff: [
    'dashboard',
    'customers',
    'products',
    'plans',
    'subscriptions',
    'invoices',
    'payments',
  ],
  customer: [
    'dashboard',
    'subscriptions',
    'invoices',
    'payments',
  ],
};

export function hasModuleAccess(role: UserRole | null | undefined, module: AppModule): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}

export function canAccessPath(role: UserRole | null | undefined, pathname: string): boolean {
  if (!role) return false;

  // Admin has access to all routes
  if (role === 'admin') return true;

  // Only admin can access settings and reports
  if (pathname.startsWith('/settings') || pathname.startsWith('/reports')) {
    return false;
  }

  // Staff can access management routes
  if (pathname.startsWith('/customers') || pathname.startsWith('/products') || pathname.startsWith('/plans')) {
    return role === 'staff';
  }

  return true;
}

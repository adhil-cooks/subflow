import { redirect } from 'next/navigation';
import { getCurrentUserWithProfile } from './actions';
import type { UserRole, Profile } from './types';
import type { User } from '@supabase/supabase-js';

export interface AuthenticatedContext {
  user: User;
  profile: Profile;
}

/**
 * Ensures the user is logged in. Redirects to /login if unauthenticated.
 */
export async function requireAuth(redirectTo = '/login'): Promise<AuthenticatedContext> {
  const { user, profile } = await getCurrentUserWithProfile();

  if (!user || !profile) {
    redirect(redirectTo);
  }

  return { user, profile };
}

/**
 * Ensures the user has one of the allowed roles.
 * Throws an error or redirects if unauthorized.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  unauthorizedRedirect = '/dashboard'
): Promise<AuthenticatedContext> {
  const context = await requireAuth();

  if (!allowedRoles.includes(context.profile.role)) {
    redirect(unauthorizedRedirect);
  }

  return context;
}

/**
 * Specific helper for admin-only operations.
 */
export async function requireAdmin(): Promise<AuthenticatedContext> {
  return requireRole(['admin']);
}

/**
 * Specific helper for staff and admin operations.
 */
export async function requireStaffOrAdmin(): Promise<AuthenticatedContext> {
  return requireRole(['admin', 'staff']);
}

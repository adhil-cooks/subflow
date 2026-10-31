import type { SubscriptionStatus } from '@/types/database.types';

/**
 * Subscription State Machine
 * 
 * Strict architectural rule: ALL SUBSCRIPTION STATUS TRANSITIONS
 * MUST BE VALIDATED SERVER-SIDE.
 * 
 * Allowed transition graph:
 * - trialing  -> active, paused, cancelled
 * - active    -> paused, past_due, cancelled
 * - paused    -> active, cancelled
 * - past_due  -> active, paused, cancelled
 * - cancelled -> (Terminal State: no transitions allowed)
 */

export const ALLOWED_SUBSCRIPTION_TRANSITIONS: Record<
  SubscriptionStatus,
  readonly SubscriptionStatus[]
> = {
  trialing: ['active', 'paused', 'cancelled'],
  active: ['paused', 'past_due', 'cancelled'],
  paused: ['active', 'cancelled'],
  past_due: ['active', 'paused', 'cancelled'],
  cancelled: [], // Terminal
} as const;

/**
 * Checks if transitioning from currentStatus to targetStatus is valid.
 */
export function canTransitionSubscription(
  currentStatus: SubscriptionStatus,
  targetStatus: SubscriptionStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_SUBSCRIPTION_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

/**
 * Asserts that the transition is valid. Throws an Error with a descriptive explanation if not.
 */
export function assertValidSubscriptionTransition(
  currentStatus: SubscriptionStatus,
  targetStatus: SubscriptionStatus
): void {
  if (!canTransitionSubscription(currentStatus, targetStatus)) {
    throw new Error(
      `Invalid subscription status transition: Cannot change status from '${currentStatus}' to '${targetStatus}'. ` +
      `Allowed transitions from '${currentStatus}' are: [${ALLOWED_SUBSCRIPTION_TRANSITIONS[currentStatus]?.join(', ') || 'none (terminal state)'}].`
    );
  }
}

/**
 * Returns the list of possible statuses a subscription can transition to.
 */
export function getAllowedTransitions(
  currentStatus: SubscriptionStatus
): readonly SubscriptionStatus[] {
  return ALLOWED_SUBSCRIPTION_TRANSITIONS[currentStatus] ?? [];
}

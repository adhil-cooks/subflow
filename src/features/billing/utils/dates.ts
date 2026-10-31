import type { BillingInterval } from '@/types/database.types';

/**
 * Date and Billing Interval Utilities for Subflow
 * 
 * Accurately calculates recurring billing cycles, trial periods,
 * due dates, and month-end boundary preservation.
 */

/**
 * Adds an integer number of days to a given date.
 */
export function addDays(date: Date | string, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Calculates the current period end date based on start date and interval.
 * Correctly clamps day of month when month ends differ (e.g., Jan 31 -> Feb 28).
 */
export function calculatePeriodEnd(
  startDate: Date | string,
  interval: BillingInterval
): Date {
  const d = new Date(startDate);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const seconds = d.getUTCSeconds();
  const ms = d.getUTCMilliseconds();

  switch (interval) {
    case 'weekly': {
      return addDays(d, 7);
    }
    case 'monthly': {
      const targetMonth = month + 1;
      const targetYear = year + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;
      const daysInTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
      const targetDay = Math.min(day, daysInTargetMonth);
      return new Date(Date.UTC(targetYear, normalizedMonth, targetDay, hours, minutes, seconds, ms));
    }
    case 'quarterly': {
      const targetMonth = month + 3;
      const targetYear = year + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;
      const daysInTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
      const targetDay = Math.min(day, daysInTargetMonth);
      return new Date(Date.UTC(targetYear, normalizedMonth, targetDay, hours, minutes, seconds, ms));
    }
    case 'yearly': {
      const targetYear = year + 1;
      const daysInTargetMonth = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
      const targetDay = Math.min(day, daysInTargetMonth);
      return new Date(Date.UTC(targetYear, month, targetDay, hours, minutes, seconds, ms));
    }
    default: {
      return addDays(d, 30);
    }
  }
}

/**
 * Computes trial end date given start date and trial period in days.
 */
export function calculateTrialEnd(
  startDate: Date | string,
  trialDays: number
): Date {
  if (trialDays <= 0) return new Date(startDate);
  return addDays(startDate, trialDays);
}

/**
 * Computes default due date for an invoice (e.g. 14 days net terms).
 */
export function calculateDueDate(
  issueDate: Date | string = new Date(),
  netTermsDays = 14
): Date {
  return addDays(issueDate, netTermsDays);
}

/**
 * Checks whether an invoice or billing item is overdue.
 */
export function isOverdueDate(dueDate: Date | string): boolean {
  return new Date(dueDate).getTime() < Date.now();
}

/**
 * Formats a Date object to ISO string.
 */
export function toIso(date: Date | string): string {
  return new Date(date).toISOString();
}

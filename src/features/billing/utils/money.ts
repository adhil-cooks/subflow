/**
 * Financial Precision Utility for Subflow Billing Engine
 * 
 * Strict architectural rule: NO FLOATING-POINT DRIFT FOR MONEY.
 * All monetary amounts are calculated in integer cents and formatted to
 * PostgreSQL NUMERIC(12, 2) compatible numbers.
 */

/**
 * Converts a floating point or string amount into integer cents.
 * Handles precision by rounding to the nearest cent.
 */
export function toCents(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined) return 0;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100);
}

/**
 * Converts integer cents back to a 2-decimal floating point number.
 */
export function fromCents(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/**
 * Rounds any number to strictly 2 decimal places.
 */
export function roundToTwoDecimals(amount: number): number {
  return fromCents(toCents(amount));
}

/**
 * Adds two monetary amounts with zero floating-point drift.
 */
export function addMoney(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

/**
 * Subtracts b from a with zero floating-point drift.
 * Never returns negative if allowNegative is false (default false).
 */
export function subtractMoney(a: number, b: number, allowNegative = false): number {
  const result = toCents(a) - toCents(b);
  if (!allowNegative && result < 0) return 0;
  return fromCents(result);
}

/**
 * Multiplies a monetary amount by a quantity or factor.
 */
export function multiplyMoney(amount: number, quantity: number): number {
  if (quantity === 0) return 0;
  const cents = toCents(amount);
  return fromCents(Math.round(cents * quantity));
}

/**
 * Calculates a discount amount given a subtotal and discount definition.
 * Supports:
 * - 'percentage': (subtotal * value%)
 * - 'fixed_amount': min(value, subtotal)
 */
export function calculateDiscount(
  subtotal: number,
  type: 'percentage' | 'fixed_amount',
  value: number
): number {
  if (subtotal <= 0 || value <= 0) return 0;

  if (type === 'fixed_amount') {
    const fixedCents = toCents(value);
    const subtotalCents = toCents(subtotal);
    return fromCents(Math.min(fixedCents, subtotalCents));
  }

  if (type === 'percentage') {
    // Percentage value e.g. 15 for 15%
    const cappedPercent = Math.min(Math.max(value, 0), 100);
    const subtotalCents = toCents(subtotal);
    const discountCents = Math.round((subtotalCents * cappedPercent) / 100);
    return fromCents(discountCents);
  }

  return 0;
}

/**
 * Calculates tax on a taxable amount given a percentage rate (e.g. 8.25 for 8.25%).
 */
export function calculateTax(taxableAmount: number, taxRate: number): number {
  if (taxableAmount <= 0 || taxRate <= 0) return 0;
  const taxableCents = toCents(taxableAmount);
  const taxCents = Math.round((taxableCents * taxRate) / 100);
  return fromCents(taxCents);
}

/**
 * Calculates the final total amount given subtotal, discount, and tax.
 * Formula: subtotal - discount + tax.
 */
export function calculateTotal(subtotal: number, discountAmount: number, taxAmount: number): number {
  const subtotalCents = toCents(subtotal);
  const discountCents = toCents(discountAmount);
  const taxCents = toCents(taxAmount);

  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const totalCents = taxableCents + taxCents;

  return fromCents(totalCents);
}

/**
 * Formats monetary amounts for display (e.g. "$1,234.50 USD").
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Pure date arithmetic helpers used across the engine.
 * All functions operate on ISO date strings (YYYY-MM-DD).
 */

/**
 * Add a (possibly fractional) number of days to an ISO date string.
 * The result is rounded to the nearest whole day.
 */
export function addDays(isoDate: string, days: number): string {
  const ms = new Date(isoDate).getTime() + Math.round(days) * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Return the YYYY-MM-DD portion of any ISO date-time string. */
export function toDateString(iso: string): string {
  return iso.slice(0, 10);
}

/** Difference in fractional days between two ISO date strings (b − a). */
export function diffDays(isoA: string, isoB: string): number {
  const msA = new Date(isoA).getTime();
  const msB = new Date(isoB).getTime();
  return (msB - msA) / (1000 * 60 * 60 * 24);
}

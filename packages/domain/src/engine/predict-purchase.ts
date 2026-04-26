import type { PurchaseHistoryEntry } from '../purchase-history.js';
import type { PurchasePrediction } from '../pantry.js';
import { addDays, toDateString, diffDays } from './date-utils.js';

/**
 * Predict the next expected purchase date from a product's purchase history.
 *
 * Rules:
 * - Uses at most the last 3 purchase dates (chronological order).
 * - Returns null when fewer than 2 purchases are available.
 * - The initial `adjustedIntervalDays` equals `averageIntervalDays` (no adjustment applied yet).
 */
export function predictPurchase(productHistory: PurchaseHistoryEntry[]): PurchasePrediction | null {
  const sorted = [...productHistory].sort(
    (a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime(),
  );

  const last3 = sorted.slice(-3);

  if (last3.length < 2) {
    return null;
  }

  const intervals: number[] = [];
  for (let i = 1; i < last3.length; i++) {
    const prev = last3[i - 1];
    const curr = last3[i];
    /* istanbul ignore next -- guard only; slice guarantees elements */
    if (!prev || !curr) continue;
    intervals.push(diffDays(toDateString(prev.purchasedAt), toDateString(curr.purchasedAt)));
  }

  const averageIntervalDays = intervals.reduce((sum, n) => sum + n, 0) / intervals.length;

  const lastEntry = last3[last3.length - 1];
  /* istanbul ignore next */
  if (!lastEntry) return null;
  const lastPurchaseDate = toDateString(lastEntry.purchasedAt);
  const nextExpectedPurchaseDate = addDays(lastPurchaseDate, averageIntervalDays);

  const dates = last3.map((e) => toDateString(e.purchasedAt));
  const lastPurchaseDates =
    dates.length === 3
      ? ([dates[0], dates[1], dates[2]] as [string, string, string])
      : ([dates[0], dates[1]] as [string, string]);

  return {
    lastPurchaseDates,
    averageIntervalDays,
    adjustedIntervalDays: averageIntervalDays,
    nextExpectedPurchaseDate,
  };
}

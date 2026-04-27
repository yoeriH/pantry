import type { PantryItem } from '../pantry.js';
import { PantryStatus } from '../pantry.js';

/**
 * Determine the effective pantry status for an item at a given point in time.
 *
 * Rules (in priority order):
 * 1. If a manual override exists → return override.status.
 * 2. If no prediction exists → return item.status as-is.
 * 3. If now >= nextExpectedPurchaseDate → possibly_running_out.
 * 4. Otherwise → in_house.
 *
 * "out" is never set automatically; only explicit overrides or manual updates
 * can produce that status.
 */
export function determinePantryStatus(item: PantryItem, now: string): PantryStatus {
  if (item.override) {
    return item.override.status;
  }

  if (!item.prediction) {
    return item.status;
  }

  if (now >= item.prediction.nextExpectedPurchaseDate) {
    return PantryStatus.possibly_running_out;
  }

  return PantryStatus.in_house;
}

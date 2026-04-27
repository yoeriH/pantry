import type { PantryItem } from '../pantry.js';
import { PantryStatus } from '../pantry.js';
import { determinePantryStatus } from './determine-pantry-status.js';

/**
 * Return the subset of pantry items whose effective status is `possibly_running_out`.
 * Original items are not mutated.
 */
export function generatePantrySuggestions(pantryItems: PantryItem[], now: string): PantryItem[] {
  return pantryItems.filter(
    (item) => determinePantryStatus(item, now) === PantryStatus.possibly_running_out,
  );
}

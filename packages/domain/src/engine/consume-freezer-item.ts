import type { FreezerItem } from '../freezer.js';

/**
 * Decrease the portion count of a freezer item by the given quantity.
 *
 * Rules:
 * - Portions are decremented by `quantity` (minimum 0 — never negative).
 * - If the resulting portion count reaches 0, the item is removed from the list.
 * - If no item matches `freezerItemId`, the list is returned unchanged.
 * - The input array is not mutated.
 */
export function consumeFreezerItem(
  freezerItems: FreezerItem[],
  freezerItemId: string,
  quantity: number,
): FreezerItem[] {
  return freezerItems
    .map((item) => {
      if (item.id !== freezerItemId) return item;
      return { ...item, portions: Math.max(0, item.portions - quantity) };
    })
    .filter((item) => item.portions > 0);
}

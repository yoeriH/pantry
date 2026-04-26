import type { ShoppingListItem } from '../shopping-list.js';

/**
 * Resolve a maybe_needed shopping list item based on the user's decision.
 *
 * - "add"  → return the item with uncertainty set to `certain`.
 * - "skip" → return null (item should be removed from the list).
 *
 * The original item is not mutated.
 */
export function resolveShoppingItem(
  item: ShoppingListItem,
  decision: 'add' | 'skip',
): ShoppingListItem | null {
  if (decision === 'add') {
    return { ...item, uncertainty: 'certain' };
  }
  return null;
}

import type {
  ShoppingListItem,
  ShoppingListItemSource,
  ShoppingListItemUncertainty,
} from '../shopping-list.js';

/**
 * Aggregate a flat list of shopping items by (productId, unit).
 *
 * Rules:
 * - Items with the same productId AND unit are merged: quantities are summed, sources are combined.
 * - Items with different units for the same product are kept separate.
 * - If ANY contributing item carries `maybe_needed` uncertainty, the merged item is `maybe_needed`.
 * - The id and category of the first occurrence in the group are preserved.
 * - Input is not mutated.
 */
export function aggregateShoppingItems(items: ShoppingListItem[]): ShoppingListItem[] {
  const order: string[] = [];
  const map = new Map<string, ShoppingListItem>();

  for (const item of items) {
    const key = `${item.productId}::${item.unit}`;

    const existing = map.get(key);
    if (existing) {
      const mergedSources: [ShoppingListItemSource, ...ShoppingListItemSource[]] = [
        ...existing.sources,
        ...item.sources,
      ];
      const uncertainty: ShoppingListItemUncertainty =
        existing.uncertainty === 'maybe_needed' || item.uncertainty === 'maybe_needed'
          ? 'maybe_needed'
          : 'certain';

      map.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
        sources: mergedSources,
        uncertainty,
      });
    } else {
      order.push(key);
      map.set(key, { ...item });
    }
  }

  return order.map((key) => {
    const item = map.get(key);
    // key was added to `order` exactly when it was inserted into `map`, so this is always defined.
    if (!item) throw new Error(`aggregateShoppingItems: key ${key} missing from map`);
    return item;
  });
}

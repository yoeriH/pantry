import type { PantryItem } from '../pantry.js';
import { PantryStatus } from '../pantry.js';
import type { PurchaseHistoryEntry } from '../purchase-history.js';
import type { ShoppingList } from '../shopping-list.js';

export interface CompleteShoppingResult {
  /** Full pantry snapshot with checked items updated to `in_house`. */
  updatedPantry: PantryItem[];
  /** One purchase history entry per checked item. */
  purchaseHistory: PurchaseHistoryEntry[];
  /** Shopping list containing only the items that were NOT checked off. */
  remainingList: ShoppingList;
}

/**
 * Complete a shopping trip.
 *
 * Rules:
 * - Checked items → create a `PurchaseHistoryEntry` and mark the corresponding
 *   pantry item as `in_house` (lastUpdatedAt = now).
 * - Unchecked items → remain in the returned list; pantry is not updated for them.
 * - Neither the original list nor the pantry array is mutated.
 *
 * @param list        The shopping list to complete.
 * @param pantryItems The current full pantry snapshot.
 * @param now         ISO date-time string for purchase timestamps.
 */
export function completeShopping(
  list: ShoppingList,
  pantryItems: PantryItem[],
  now: string,
): CompleteShoppingResult {
  const checkedItems = list.items.filter((i) => i.status === 'checked');
  const uncheckedItems = list.items.filter((i) => i.status === 'unchecked');

  const purchaseHistory: PurchaseHistoryEntry[] = checkedItems.map((item) => ({
    id: `ph-${list.id}-${item.id}`,
    productId: item.productId,
    purchasedAt: now,
    source: { shoppingListId: list.id },
  }));

  const checkedProductIds = new Set(checkedItems.map((i) => i.productId));

  const updatedPantry: PantryItem[] = pantryItems.map((item) => {
    if (checkedProductIds.has(item.productId)) {
      return { ...item, status: PantryStatus.in_house, lastUpdatedAt: now };
    }
    return item;
  });

  const remainingList: ShoppingList = {
    ...list,
    items: uncheckedItems,
  };

  return { updatedPantry, purchaseHistory, remainingList };
}

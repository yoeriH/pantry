import type { PantryItem } from '../pantry.js';
import { PantryStatus } from '../pantry.js';
import type { PurchaseHistoryEntry } from '../purchase-history.js';
import type { ShoppingList } from '../shopping-list.js';

export interface CompleteShoppingInput {
  /** The active shopping list to complete. */
  list: ShoppingList;
  /** The current full pantry snapshot. */
  pantryItems: PantryItem[];
  /** The existing purchase history — new entries will be appended. */
  purchaseHistory: PurchaseHistoryEntry[];
  /** ISO date-time string representing "now". */
  now: string;
}

export interface CompleteShoppingResult {
  /** Full pantry snapshot with checked items updated or created as `in_house`. */
  updatedPantry: PantryItem[];
  /**
   * Existing purchase history extended with one new entry per checked item.
   * Preserves the order of the original history.
   */
  purchaseHistory: PurchaseHistoryEntry[];
  /**
   * The original shopping list archived with `completedAt = now`.
   * Contains all items (checked and unchecked) for audit purposes.
   */
  completedList: ShoppingList;
  /** Active shopping list containing only the unchecked items. No `completedAt`. */
  remainingList: ShoppingList;
}

/**
 * Complete a shopping trip.
 *
 * Rules:
 * - Checked items → append a `PurchaseHistoryEntry` and update or create the
 *   corresponding `PantryItem` with status `in_house`.
 * - Unchecked items → remain in the `remainingList`; pantry is not updated.
 * - The original `list` is archived as `completedList` with `completedAt = now`.
 * - The `remainingList` contains only unchecked items and has no `completedAt`.
 * - None of the input arrays or objects are mutated.
 */
export function completeShopping(input: CompleteShoppingInput): CompleteShoppingResult {
  const { list, pantryItems, purchaseHistory, now } = input;

  const checkedItems = list.items.filter((i) => i.status === 'checked');
  const uncheckedItems = list.items.filter((i) => i.status === 'unchecked');

  const newHistoryEntries: PurchaseHistoryEntry[] = checkedItems.map((item) => ({
    id: `ph-${list.id}-${item.id}`,
    productId: item.productId,
    purchasedAt: now,
    source: { shoppingListId: list.id },
  }));

  const checkedProductIds = new Set(checkedItems.map((i) => i.productId));
  const existingProductIds = new Set(pantryItems.map((p) => p.productId));

  // Update existing pantry items that were checked off.
  const updatedPantry: PantryItem[] = pantryItems.map((item) => {
    if (checkedProductIds.has(item.productId)) {
      return { ...item, status: PantryStatus.in_house, lastUpdatedAt: now };
    }
    return item;
  });

  // Create new pantry items for checked products that have no existing entry.
  for (const item of checkedItems) {
    if (!existingProductIds.has(item.productId)) {
      updatedPantry.push({
        productId: item.productId,
        status: PantryStatus.in_house,
        lastUpdatedAt: now,
      });
    }
  }

  const completedList: ShoppingList = { ...list, completedAt: now };

  const remainingList: ShoppingList = {
    ...list,
    items: uncheckedItems,
  };

  return {
    updatedPantry,
    purchaseHistory: [...purchaseHistory, ...newHistoryEntries],
    completedList,
    remainingList,
  };
}

/**
 * Shopping list (boodschappenlijst) — one shared household shopping list, mobile-first.
 * Items may be aggregated (same product + same unit), and may carry uncertainty.
 */

import type { ProductCategory, Unit } from './product.js';

/** Why a shopping-list item was added (see PRODUCT_SPEC §5.7). */
export type ShoppingListItemSourceType = 'pantry' | 'recipe' | 'manual';

export interface ShoppingListItemSource {
  type: ShoppingListItemSourceType;
  /** Recipe id (when type is 'recipe') or another reference id. */
  referenceId?: string;
  note?: string;
}

/** Whether the item has been checked off during a shopping trip. */
export type ShoppingListItemStatus = 'unchecked' | 'checked';

/**
 * Uncertainty of an item — "misschien nodig" must be explicit so users can
 * resolve it before shopping (see PRODUCT_SPEC §5.7 and §8).
 */
export type ShoppingListItemUncertainty = 'certain' | 'maybe_needed';

export interface ShoppingListItem {
  id: string;
  productId: string;
  quantity: number;
  unit: Unit;
  category: ProductCategory;
  /**
   * One or more reasons this item appears on the list.
   * Multiple sources arise when the same product+unit is aggregated from
   * different origins (e.g. two recipes both needing uien).
   */
  sources: [ShoppingListItemSource, ...ShoppingListItemSource[]];
  status: ShoppingListItemStatus;
  uncertainty: ShoppingListItemUncertainty;
}

export interface ShoppingList {
  id: string;
  /** ISO date-time string of when this list was created. */
  createdAt: string;
  /** ISO date-time string of when the shopping trip was completed. Absent for the active list. */
  completedAt?: string;
  items: ShoppingListItem[];
}

/**
 * Purchase history — append-only record of completed purchase events.
 * Only items that were checked during a completed shopping trip are recorded here.
 */

export interface PurchaseHistoryEntry {
  id: string;
  productId: string;
  /** ISO date-time string of when the purchase was completed. */
  purchasedAt: string;
  /** The shopping list that generated this purchase, if applicable. */
  source?: { shoppingListId: string };
}

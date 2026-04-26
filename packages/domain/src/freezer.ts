/**
 * Freezer (vriezer) — tracks portions of prepared meals and loose freezer products.
 * One portion = one full-household serving.
 */

export interface FreezerItem {
  id: string;
  /** Link to an existing product by id when the freezer item corresponds to a known product. */
  productId?: string;
  /**
   * Free-text name used when no structured product exists for this freezer item
   * (e.g. a home-cooked dish not listed as a product).
   * At least one of productId or name must be provided.
   */
  name?: string;
  /** Number of whole-household portions currently in the freezer. */
  portions: number;
  /** ISO date-time string of when this item was added to the freezer. */
  createdAt: string;
}

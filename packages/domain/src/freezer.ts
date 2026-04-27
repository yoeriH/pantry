/**
 * Freezer (vriezer) — tracks portions of prepared meals and loose freezer products.
 * One portion = one full-household serving.
 */

/**
 * Enforces that a FreezerItem must identify itself by at least one of:
 * a known product id, or a free-text name.
 */
type FreezerItemIdentity =
  | { productId: string; name?: string }
  | { productId?: string; name: string };

export type FreezerItem = FreezerItemIdentity & {
  id: string;
  /** Number of whole-household portions currently in the freezer. */
  portions: number;
  /** ISO date-time string of when this item was added to the freezer. */
  createdAt: string;
};

/**
 * Pantry (voorraad) — tracks the known status of each product in the household.
 * Tracks status per product, not exact counts.
 */

export enum PantryStatus {
  in_house = 'in_house',
  possibly_running_out = 'possibly_running_out',
  out = 'out',
}

export enum PredictionAdjustment {
  faster = 'faster',
  normal = 'normal',
  slower = 'slower',
}

/** Calculated prediction data derived from purchase history. */
export interface PurchasePrediction {
  /** The dates of the last (up to) 3 completed purchases for this product (ISO date strings). */
  lastPurchaseDates: [string] | [string, string] | [string, string, string];
  /** Average number of days between the tracked purchases. */
  averageIntervalDays: number;
  /** Interval after applying the one-shot ±25% adjustment. */
  adjustedIntervalDays: number;
  /** ISO date string of the projected next purchase date. */
  nextExpectedPurchaseDate: string;
}

/** Optional one-shot status override set by the user. */
export interface PantryOverride {
  status: PantryStatus;
  setAt: string;
}

export interface PantryItem {
  productId: string;
  status: PantryStatus;
  /** ISO date-time string of the last status change. */
  lastUpdatedAt: string;
  /** Derived prediction based on purchase history. Present only when sufficient history exists. */
  prediction?: PurchasePrediction;
  /** Manual override applied by the user. */
  override?: PantryOverride;
}

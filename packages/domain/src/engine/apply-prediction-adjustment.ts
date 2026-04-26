import type { PurchasePrediction } from '../pantry.js';
import { PredictionAdjustment } from '../pantry.js';
import { addDays } from './date-utils.js';

/**
 * Apply a one-shot speed adjustment to an existing purchase prediction.
 *
 * Rules:
 * - faster → adjustedIntervalDays = averageIntervalDays × 0.75
 * - normal → adjustedIntervalDays = averageIntervalDays (unchanged)
 * - slower → adjustedIntervalDays = averageIntervalDays × 1.25
 * - nextExpectedPurchaseDate is recalculated from the last purchase date + adjusted interval.
 */
export function applyPredictionAdjustment(
  prediction: PurchasePrediction,
  adjustment: PredictionAdjustment,
): PurchasePrediction {
  const multipliers: Record<PredictionAdjustment, number> = {
    [PredictionAdjustment.faster]: 0.75,
    [PredictionAdjustment.normal]: 1.0,
    [PredictionAdjustment.slower]: 1.25,
  };

  const adjustedIntervalDays = prediction.averageIntervalDays * multipliers[adjustment];
  const lastPurchaseDates = prediction.lastPurchaseDates;
  const lastPurchaseDate = lastPurchaseDates[lastPurchaseDates.length - 1] ?? lastPurchaseDates[0];
  const nextExpectedPurchaseDate = addDays(lastPurchaseDate, adjustedIntervalDays);

  return {
    ...prediction,
    adjustedIntervalDays,
    nextExpectedPurchaseDate,
  };
}

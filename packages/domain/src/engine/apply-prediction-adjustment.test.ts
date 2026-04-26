import { describe, it, expect } from 'vitest';
import { applyPredictionAdjustment } from './apply-prediction-adjustment.js';
import { PredictionAdjustment } from '../pantry.js';
import type { PurchasePrediction } from '../pantry.js';

const basePrediction: PurchasePrediction = {
  lastPurchaseDates: ['2026-04-04', '2026-04-11'],
  averageIntervalDays: 7,
  adjustedIntervalDays: 7,
  nextExpectedPurchaseDate: '2026-04-18',
};

describe('applyPredictionAdjustment', () => {
  it('faster reduces interval by 25% and recalculates next date', () => {
    const result = applyPredictionAdjustment(basePrediction, PredictionAdjustment.faster);
    expect(result.adjustedIntervalDays).toBeCloseTo(5.25);
    // 2026-04-11 + 5.25 days ≈ 2026-04-16 (round(5.25) = 5 → 2026-04-16)
    expect(result.nextExpectedPurchaseDate).toBe('2026-04-16');
    expect(result.averageIntervalDays).toBe(7); // unchanged
  });

  it('normal leaves interval unchanged and keeps the same next date', () => {
    const result = applyPredictionAdjustment(basePrediction, PredictionAdjustment.normal);
    expect(result.adjustedIntervalDays).toBe(7);
    expect(result.nextExpectedPurchaseDate).toBe('2026-04-18');
    expect(result.averageIntervalDays).toBe(7);
  });

  it('slower increases interval by 25% and recalculates next date', () => {
    const result = applyPredictionAdjustment(basePrediction, PredictionAdjustment.slower);
    expect(result.adjustedIntervalDays).toBeCloseTo(8.75);
    // 2026-04-11 + round(8.75) = 2026-04-11 + 9 = 2026-04-20
    expect(result.nextExpectedPurchaseDate).toBe('2026-04-20');
    expect(result.averageIntervalDays).toBe(7);
  });

  it('does not mutate the original prediction', () => {
    const original = { ...basePrediction };
    applyPredictionAdjustment(basePrediction, PredictionAdjustment.faster);
    expect(basePrediction).toEqual(original);
  });

  it('uses the last purchase date for recalculation (3-entry tuple)', () => {
    const threeEntry: PurchasePrediction = {
      lastPurchaseDates: ['2026-03-28', '2026-04-04', '2026-04-11'],
      averageIntervalDays: 7,
      adjustedIntervalDays: 7,
      nextExpectedPurchaseDate: '2026-04-18',
    };
    const result = applyPredictionAdjustment(threeEntry, PredictionAdjustment.normal);
    // Last date is 2026-04-11 + 7 days = 2026-04-18
    expect(result.nextExpectedPurchaseDate).toBe('2026-04-18');
  });
});

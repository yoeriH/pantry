import { describe, it, expect } from 'vitest';
import { predictPurchase } from './predict-purchase.js';
import type { PurchaseHistoryEntry } from '../purchase-history.js';

const entry = (id: string, productId: string, purchasedAt: string): PurchaseHistoryEntry => ({
  id,
  productId,
  purchasedAt,
});

describe('predictPurchase', () => {
  it('returns null for an empty history', () => {
    expect(predictPurchase([])).toBeNull();
  });

  it('returns null for a single entry', () => {
    expect(predictPurchase([entry('p1', 'milk', '2026-04-01T10:00:00Z')])).toBeNull();
  });

  it('calculates average interval from exactly 2 entries', () => {
    const history = [
      entry('p1', 'milk', '2026-04-01T10:00:00Z'),
      entry('p2', 'milk', '2026-04-08T10:00:00Z'),
    ];
    const result = predictPurchase(history);
    expect(result).not.toBeNull();
    expect(result!.averageIntervalDays).toBe(7);
    expect(result!.adjustedIntervalDays).toBe(7);
    expect(result!.nextExpectedPurchaseDate).toBe('2026-04-15');
    expect(result!.lastPurchaseDates).toEqual(['2026-04-01', '2026-04-08']);
  });

  it('calculates average interval from exactly 3 entries', () => {
    const history = [
      entry('p1', 'milk', '2026-03-28T11:00:00Z'),
      entry('p2', 'milk', '2026-04-04T11:00:00Z'),
      entry('p3', 'milk', '2026-04-11T11:00:00Z'),
    ];
    const result = predictPurchase(history);
    expect(result).not.toBeNull();
    expect(result!.averageIntervalDays).toBe(7);
    expect(result!.nextExpectedPurchaseDate).toBe('2026-04-18');
    expect(result!.lastPurchaseDates).toEqual(['2026-03-28', '2026-04-04', '2026-04-11']);
  });

  it('uses only the last 3 entries when more than 3 are provided', () => {
    const history = [
      entry('p1', 'milk', '2026-03-01T10:00:00Z'), // older — should be ignored
      entry('p2', 'milk', '2026-03-28T11:00:00Z'),
      entry('p3', 'milk', '2026-04-04T11:00:00Z'),
      entry('p4', 'milk', '2026-04-11T11:00:00Z'),
    ];
    const result = predictPurchase(history);
    expect(result).not.toBeNull();
    expect(result!.lastPurchaseDates).toEqual(['2026-03-28', '2026-04-04', '2026-04-11']);
    expect(result!.averageIntervalDays).toBe(7);
  });

  it('sorts entries by date before selecting the last 3', () => {
    // Deliberately out of order
    const history = [
      entry('p4', 'milk', '2026-04-11T11:00:00Z'),
      entry('p2', 'milk', '2026-04-04T11:00:00Z'),
      entry('p1', 'milk', '2026-03-28T11:00:00Z'),
    ];
    const result = predictPurchase(history);
    expect(result).not.toBeNull();
    expect(result!.averageIntervalDays).toBe(7);
  });

  it('handles unequal intervals by averaging them', () => {
    const history = [
      entry('p1', 'prod', '2026-04-01T10:00:00Z'), // 4 days gap
      entry('p2', 'prod', '2026-04-05T10:00:00Z'), // 10 days gap
      entry('p3', 'prod', '2026-04-15T10:00:00Z'),
    ];
    const result = predictPurchase(history);
    expect(result).not.toBeNull();
    expect(result!.averageIntervalDays).toBe(7); // (4 + 10) / 2
    expect(result!.nextExpectedPurchaseDate).toBe('2026-04-22');
  });

  it('sets adjustedIntervalDays equal to averageIntervalDays initially', () => {
    const history = [
      entry('p1', 'prod', '2026-04-01T10:00:00Z'),
      entry('p2', 'prod', '2026-04-08T10:00:00Z'),
    ];
    const result = predictPurchase(history)!;
    expect(result.adjustedIntervalDays).toBe(result.averageIntervalDays);
  });
});

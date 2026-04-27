import { describe, it, expect } from 'vitest';
import { determinePantryStatus } from './determine-pantry-status.js';
import { PantryStatus } from '../pantry.js';
import type { PantryItem } from '../pantry.js';

const baseItem: PantryItem = {
  productId: 'prod-melk',
  status: PantryStatus.in_house,
  lastUpdatedAt: '2026-04-25T07:30:00Z',
};

const itemWithPrediction: PantryItem = {
  ...baseItem,
  prediction: {
    lastPurchaseDates: ['2026-03-28', '2026-04-04', '2026-04-11'],
    averageIntervalDays: 7,
    adjustedIntervalDays: 7,
    nextExpectedPurchaseDate: '2026-04-18',
  },
};

describe('determinePantryStatus', () => {
  it('returns override status when an override is set', () => {
    const item: PantryItem = {
      ...itemWithPrediction,
      override: { status: PantryStatus.out, setAt: '2026-04-20T10:00:00Z' },
    };
    expect(determinePantryStatus(item, '2026-04-10')).toBe(PantryStatus.out);
  });

  it('override takes priority over prediction', () => {
    const item: PantryItem = {
      ...itemWithPrediction,
      override: { status: PantryStatus.in_house, setAt: '2026-04-20T10:00:00Z' },
    };
    // Even though now >= nextExpectedPurchaseDate, override wins
    expect(determinePantryStatus(item, '2026-04-25')).toBe(PantryStatus.in_house);
  });

  it('returns current item status when no prediction exists', () => {
    expect(determinePantryStatus(baseItem, '2026-04-26')).toBe(PantryStatus.in_house);
  });

  it('returns possibly_running_out when now equals nextExpectedPurchaseDate', () => {
    expect(determinePantryStatus(itemWithPrediction, '2026-04-18')).toBe(
      PantryStatus.possibly_running_out,
    );
  });

  it('returns possibly_running_out when now is after nextExpectedPurchaseDate', () => {
    expect(determinePantryStatus(itemWithPrediction, '2026-04-26')).toBe(
      PantryStatus.possibly_running_out,
    );
  });

  it('returns in_house when now is before nextExpectedPurchaseDate', () => {
    expect(determinePantryStatus(itemWithPrediction, '2026-04-17')).toBe(PantryStatus.in_house);
  });

  it('preserves possibly_running_out status when there is no prediction', () => {
    const item: PantryItem = {
      ...baseItem,
      status: PantryStatus.possibly_running_out,
    };
    expect(determinePantryStatus(item, '2026-04-01')).toBe(PantryStatus.possibly_running_out);
  });

  it('does not automatically produce out status via prediction', () => {
    const result = determinePantryStatus(itemWithPrediction, '2026-05-01');
    expect(result).not.toBe(PantryStatus.out);
  });
});

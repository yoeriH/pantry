import { describe, it, expect } from 'vitest';
import { addDays, toDateString, diffDays } from './date-utils.js';

describe('addDays', () => {
  it('adds whole days', () => {
    expect(addDays('2026-04-01', 7)).toBe('2026-04-08');
  });

  it('rounds fractional days', () => {
    expect(addDays('2026-04-01', 7.5)).toBe('2026-04-09');
    expect(addDays('2026-04-01', 7.4)).toBe('2026-04-08');
  });

  it('handles month boundary', () => {
    expect(addDays('2026-01-28', 7)).toBe('2026-02-04');
  });

  it('adds zero days', () => {
    expect(addDays('2026-04-01', 0)).toBe('2026-04-01');
  });
});

describe('toDateString', () => {
  it('extracts date from ISO datetime', () => {
    expect(toDateString('2026-04-11T11:00:00Z')).toBe('2026-04-11');
  });

  it('returns date as-is when already a date string', () => {
    expect(toDateString('2026-04-11')).toBe('2026-04-11');
  });
});

describe('diffDays', () => {
  it('returns 7 for a week apart', () => {
    expect(diffDays('2026-04-01', '2026-04-08')).toBe(7);
  });

  it('returns 0 for the same date', () => {
    expect(diffDays('2026-04-01', '2026-04-01')).toBe(0);
  });

  it('returns a negative value when b is before a', () => {
    expect(diffDays('2026-04-08', '2026-04-01')).toBe(-7);
  });
});

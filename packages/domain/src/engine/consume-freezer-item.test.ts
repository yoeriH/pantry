import { describe, it, expect } from 'vitest';
import { consumeFreezerItem } from './consume-freezer-item.js';
import type { FreezerItem } from '../freezer.js';

const freezerItems: FreezerItem[] = [
  { id: 'fi-chili', name: 'Chili con carne', portions: 3, createdAt: '2026-04-19T20:00:00Z' },
  { id: 'fi-kip', name: 'Kippendijen', portions: 4, createdAt: '2026-04-12T15:00:00Z' },
];

describe('consumeFreezerItem', () => {
  it('decreases portions by the given quantity', () => {
    const result = consumeFreezerItem(freezerItems, 'fi-chili', 1);
    const chili = result.find((i) => i.id === 'fi-chili');
    expect(chili?.portions).toBe(2);
  });

  it('removes the item when portions reach 0', () => {
    const result = consumeFreezerItem(freezerItems, 'fi-chili', 3);
    expect(result.find((i) => i.id === 'fi-chili')).toBeUndefined();
    expect(result).toHaveLength(1);
  });

  it('clamps to 0 — never produces negative portions', () => {
    const result = consumeFreezerItem(freezerItems, 'fi-chili', 10);
    expect(result.find((i) => i.id === 'fi-chili')).toBeUndefined();
  });

  it('does not affect other items in the list', () => {
    const result = consumeFreezerItem(freezerItems, 'fi-chili', 1);
    const kip = result.find((i) => i.id === 'fi-kip');
    expect(kip?.portions).toBe(4);
  });

  it('returns the list unchanged when the id does not exist', () => {
    const result = consumeFreezerItem(freezerItems, 'fi-unknown', 1);
    expect(result).toHaveLength(2);
    expect(result[0]?.portions).toBe(3);
    expect(result[1]?.portions).toBe(4);
  });

  it('does not mutate the original array', () => {
    consumeFreezerItem(freezerItems, 'fi-chili', 1);
    expect(freezerItems[0]?.portions).toBe(3);
  });

  it('removes the item when consuming exactly all portions', () => {
    const result = consumeFreezerItem(freezerItems, 'fi-kip', 4);
    expect(result.find((i) => i.id === 'fi-kip')).toBeUndefined();
  });
});

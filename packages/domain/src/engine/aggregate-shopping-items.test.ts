import { describe, it, expect } from 'vitest';
import { aggregateShoppingItems } from './aggregate-shopping-items.js';
import type { ShoppingListItem } from '../shopping-list.js';
import { Unit, ProductCategory } from '../product.js';

const makeItem = (
  id: string,
  productId: string,
  unit: Unit,
  quantity: number,
  uncertainty: 'certain' | 'maybe_needed' = 'certain',
): ShoppingListItem => ({
  id,
  productId,
  quantity,
  unit,
  category: ProductCategory.houdbaar,
  sources: [{ type: 'recipe', referenceId: id }],
  status: 'unchecked',
  uncertainty,
});

describe('aggregateShoppingItems', () => {
  it('returns an empty array for empty input', () => {
    expect(aggregateShoppingItems([])).toEqual([]);
  });

  it('returns items unchanged when there are no duplicates', () => {
    const items = [
      makeItem('i1', 'prod-a', Unit.stuk, 2),
      makeItem('i2', 'prod-b', Unit.gram, 500),
    ];
    expect(aggregateShoppingItems(items)).toHaveLength(2);
  });

  it('merges items with the same productId and unit', () => {
    const items = [
      makeItem('i1', 'prod-ui', Unit.stuk, 2),
      makeItem('i2', 'prod-ui', Unit.stuk, 1),
    ];
    const result = aggregateShoppingItems(items);
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(3);
  });

  it('does NOT merge items with the same productId but different units', () => {
    const items = [
      makeItem('i1', 'prod-olie', Unit.milliliter, 30),
      makeItem('i2', 'prod-olie', Unit.fles, 1),
    ];
    const result = aggregateShoppingItems(items);
    expect(result).toHaveLength(2);
  });

  it('merges sources from all contributing items', () => {
    const items = [
      makeItem('i1', 'prod-ui', Unit.stuk, 2),
      makeItem('i2', 'prod-ui', Unit.stuk, 1),
    ];
    const result = aggregateShoppingItems(items);
    expect(result[0]?.sources).toHaveLength(2);
  });

  it('preserves maybe_needed if ANY source is maybe_needed', () => {
    const items = [
      makeItem('i1', 'prod-ui', Unit.stuk, 2, 'certain'),
      makeItem('i2', 'prod-ui', Unit.stuk, 1, 'maybe_needed'),
    ];
    const result = aggregateShoppingItems(items);
    expect(result[0]?.uncertainty).toBe('maybe_needed');
  });

  it('preserves certain when all sources are certain', () => {
    const items = [
      makeItem('i1', 'prod-ui', Unit.stuk, 2, 'certain'),
      makeItem('i2', 'prod-ui', Unit.stuk, 1, 'certain'),
    ];
    const result = aggregateShoppingItems(items);
    expect(result[0]?.uncertainty).toBe('certain');
  });

  it('preserves the id and category of the first occurrence', () => {
    const items = [
      makeItem('first-id', 'prod-ui', Unit.stuk, 2),
      makeItem('second-id', 'prod-ui', Unit.stuk, 1),
    ];
    const result = aggregateShoppingItems(items);
    expect(result[0]?.id).toBe('first-id');
    expect(result[0]?.category).toBe(ProductCategory.houdbaar);
  });

  it('does not mutate the input items', () => {
    const items = [
      makeItem('i1', 'prod-ui', Unit.stuk, 2),
      makeItem('i2', 'prod-ui', Unit.stuk, 1),
    ];
    aggregateShoppingItems(items);
    expect(items[0]?.quantity).toBe(2);
    expect(items[1]?.quantity).toBe(1);
  });

  it('preserves insertion order of first occurrences', () => {
    const items = [
      makeItem('ia', 'prod-a', Unit.stuk, 1),
      makeItem('ib', 'prod-b', Unit.stuk, 1),
      makeItem('ia2', 'prod-a', Unit.stuk, 1),
    ];
    const result = aggregateShoppingItems(items);
    expect(result[0]?.productId).toBe('prod-a');
    expect(result[1]?.productId).toBe('prod-b');
  });
});

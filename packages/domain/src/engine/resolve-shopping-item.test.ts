import { describe, it, expect } from 'vitest';
import { resolveShoppingItem } from './resolve-shopping-item.js';
import type { ShoppingListItem } from '../shopping-list.js';
import { Unit, ProductCategory } from '../product.js';

const maybeItem: ShoppingListItem = {
  id: 'sli-parm',
  productId: 'prod-parmezaan',
  quantity: 50,
  unit: Unit.gram,
  category: ProductCategory.zuivel,
  sources: [{ type: 'recipe', referenceId: 'recipe-pasta' }],
  status: 'unchecked',
  uncertainty: 'maybe_needed',
};

describe('resolveShoppingItem', () => {
  it('returns item with certain uncertainty when decision is add', () => {
    const result = resolveShoppingItem(maybeItem, 'add');
    expect(result).not.toBeNull();
    expect(result!.uncertainty).toBe('certain');
  });

  it('preserves all other fields when adding', () => {
    const result = resolveShoppingItem(maybeItem, 'add')!;
    expect(result.id).toBe(maybeItem.id);
    expect(result.productId).toBe(maybeItem.productId);
    expect(result.quantity).toBe(maybeItem.quantity);
    expect(result.status).toBe(maybeItem.status);
  });

  it('returns null when decision is skip', () => {
    expect(resolveShoppingItem(maybeItem, 'skip')).toBeNull();
  });

  it('does not mutate the original item', () => {
    resolveShoppingItem(maybeItem, 'add');
    expect(maybeItem.uncertainty).toBe('maybe_needed');
  });
});

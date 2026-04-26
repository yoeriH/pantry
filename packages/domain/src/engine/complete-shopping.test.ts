import { describe, it, expect } from 'vitest';
import { completeShopping } from './complete-shopping.js';
import { PantryStatus } from '../pantry.js';
import type { PantryItem } from '../pantry.js';
import type { ShoppingList, ShoppingListItem } from '../shopping-list.js';
import { Unit, ProductCategory } from '../product.js';

const makeItem = (
  id: string,
  productId: string,
  status: 'checked' | 'unchecked',
): ShoppingListItem => ({
  id,
  productId,
  quantity: 1,
  unit: Unit.stuk,
  category: ProductCategory.groente_fruit,
  sources: [{ type: 'manual' }],
  status,
  uncertainty: 'certain',
});

const pantryItems: PantryItem[] = [
  { productId: 'prod-gehakt', status: PantryStatus.out, lastUpdatedAt: '2026-04-24T09:00:00Z' },
  {
    productId: 'prod-melk',
    status: PantryStatus.possibly_running_out,
    lastUpdatedAt: '2026-04-25T07:30:00Z',
  },
  { productId: 'prod-pasta', status: PantryStatus.in_house, lastUpdatedAt: '2026-04-19T10:00:00Z' },
];

const shoppingList: ShoppingList = {
  id: 'sl-test',
  createdAt: '2026-04-26T08:00:00Z',
  items: [
    makeItem('sli-1', 'prod-gehakt', 'checked'),
    makeItem('sli-2', 'prod-melk', 'unchecked'),
    makeItem('sli-3', 'prod-pasta', 'checked'),
  ],
};

const now = '2026-04-26T12:00:00Z';

describe('completeShopping', () => {
  it('creates purchase history entries only for checked items', () => {
    const { purchaseHistory } = completeShopping(shoppingList, pantryItems, now);
    expect(purchaseHistory).toHaveLength(2);
    expect(purchaseHistory.map((e) => e.productId)).toEqual(
      expect.arrayContaining(['prod-gehakt', 'prod-pasta']),
    );
  });

  it('sets purchasedAt to now on each entry', () => {
    const { purchaseHistory } = completeShopping(shoppingList, pantryItems, now);
    expect(purchaseHistory.every((e) => e.purchasedAt === now)).toBe(true);
  });

  it('records the shopping list id as the purchase source', () => {
    const { purchaseHistory } = completeShopping(shoppingList, pantryItems, now);
    expect(purchaseHistory.every((e) => e.source?.shoppingListId === 'sl-test')).toBe(true);
  });

  it('updates checked pantry items to in_house', () => {
    const { updatedPantry } = completeShopping(shoppingList, pantryItems, now);
    const gehakt = updatedPantry.find((p) => p.productId === 'prod-gehakt');
    const pasta = updatedPantry.find((p) => p.productId === 'prod-pasta');
    expect(gehakt?.status).toBe(PantryStatus.in_house);
    expect(pasta?.status).toBe(PantryStatus.in_house);
  });

  it('does not modify unchecked pantry items', () => {
    const { updatedPantry } = completeShopping(shoppingList, pantryItems, now);
    const melk = updatedPantry.find((p) => p.productId === 'prod-melk');
    expect(melk?.status).toBe(PantryStatus.possibly_running_out);
  });

  it('sets lastUpdatedAt on updated items', () => {
    const { updatedPantry } = completeShopping(shoppingList, pantryItems, now);
    const gehakt = updatedPantry.find((p) => p.productId === 'prod-gehakt');
    expect(gehakt?.lastUpdatedAt).toBe(now);
  });

  it('keeps unchecked items in the remaining list', () => {
    const { remainingList } = completeShopping(shoppingList, pantryItems, now);
    expect(remainingList.items).toHaveLength(1);
    expect(remainingList.items[0]?.productId).toBe('prod-melk');
  });

  it('does not mutate the original shopping list', () => {
    completeShopping(shoppingList, pantryItems, now);
    expect(shoppingList.items).toHaveLength(3);
  });

  it('does not mutate the original pantry items array', () => {
    completeShopping(shoppingList, pantryItems, now);
    expect(pantryItems[0]?.status).toBe(PantryStatus.out);
  });

  it('returns an empty purchase history when no items are checked', () => {
    const allUnchecked: ShoppingList = {
      ...shoppingList,
      items: shoppingList.items.map((i) => ({ ...i, status: 'unchecked' as const })),
    };
    const { purchaseHistory, remainingList } = completeShopping(allUnchecked, pantryItems, now);
    expect(purchaseHistory).toHaveLength(0);
    expect(remainingList.items).toHaveLength(3);
  });
});

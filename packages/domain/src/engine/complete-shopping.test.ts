import { describe, it, expect } from 'vitest';
import { completeShopping } from './complete-shopping.js';
import { PantryStatus } from '../pantry.js';
import type { PantryItem } from '../pantry.js';
import type { PurchaseHistoryEntry } from '../purchase-history.js';
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

const existingHistory: PurchaseHistoryEntry[] = [
  {
    id: 'ph-prev-1',
    productId: 'prod-melk',
    purchasedAt: '2026-04-19T11:00:00Z',
    source: { shoppingListId: 'sl-prev' },
  },
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

/** Convenience wrapper using the shared fixtures. */
const run = (overrides?: Partial<Parameters<typeof completeShopping>[0]>) =>
  completeShopping({
    list: shoppingList,
    pantryItems,
    purchaseHistory: existingHistory,
    now,
    ...overrides,
  });

describe('completeShopping', () => {
  // -------------------------------------------------------------------------
  // Purchase history
  // -------------------------------------------------------------------------

  it('appends new entries to the existing purchase history', () => {
    const { purchaseHistory } = run();
    // 1 existing + 2 newly checked = 3 total
    expect(purchaseHistory).toHaveLength(3);
  });

  it('preserves existing purchase history entries at the start', () => {
    const { purchaseHistory } = run();
    expect(purchaseHistory[0]).toEqual(existingHistory[0]);
  });

  it('creates new entries only for checked items', () => {
    const { purchaseHistory } = run();
    const newEntries = purchaseHistory.slice(1);
    expect(newEntries.map((e) => e.productId)).toEqual(
      expect.arrayContaining(['prod-gehakt', 'prod-pasta']),
    );
  });

  it('sets purchasedAt to now on each new entry', () => {
    const { purchaseHistory } = run();
    const newEntries = purchaseHistory.slice(1);
    expect(newEntries.every((e) => e.purchasedAt === now)).toBe(true);
  });

  it('records the shopping list id as the purchase source', () => {
    const { purchaseHistory } = run();
    const newEntries = purchaseHistory.slice(1);
    expect(newEntries.every((e) => e.source?.shoppingListId === 'sl-test')).toBe(true);
  });

  it('returns empty new entries when no items are checked', () => {
    const allUnchecked: ShoppingList = {
      ...shoppingList,
      items: shoppingList.items.map((i) => ({ ...i, status: 'unchecked' as const })),
    };
    const { purchaseHistory } = run({ list: allUnchecked });
    // Only the original entry remains
    expect(purchaseHistory).toHaveLength(1);
    expect(purchaseHistory[0]).toEqual(existingHistory[0]);
  });

  // -------------------------------------------------------------------------
  // Pantry — update existing
  // -------------------------------------------------------------------------

  it('updates checked pantry items to in_house', () => {
    const { updatedPantry } = run();
    const gehakt = updatedPantry.find((p) => p.productId === 'prod-gehakt');
    const pasta = updatedPantry.find((p) => p.productId === 'prod-pasta');
    expect(gehakt?.status).toBe(PantryStatus.in_house);
    expect(pasta?.status).toBe(PantryStatus.in_house);
  });

  it('does not modify unchecked pantry items', () => {
    const { updatedPantry } = run();
    const melk = updatedPantry.find((p) => p.productId === 'prod-melk');
    expect(melk?.status).toBe(PantryStatus.possibly_running_out);
  });

  it('sets lastUpdatedAt to now on updated items', () => {
    const { updatedPantry } = run();
    const gehakt = updatedPantry.find((p) => p.productId === 'prod-gehakt');
    expect(gehakt?.lastUpdatedAt).toBe(now);
  });

  // -------------------------------------------------------------------------
  // Pantry — create new items for unknown products
  // -------------------------------------------------------------------------

  it('creates a new pantry item when a checked product has no existing entry', () => {
    const newProductList: ShoppingList = {
      ...shoppingList,
      items: [makeItem('sli-new', 'prod-kaas', 'checked')],
    };
    const { updatedPantry } = run({ list: newProductList });
    const kaas = updatedPantry.find((p) => p.productId === 'prod-kaas');
    expect(kaas).toBeDefined();
    expect(kaas!.status).toBe(PantryStatus.in_house);
    expect(kaas!.lastUpdatedAt).toBe(now);
  });

  it('does not create duplicate entries for products already in pantry', () => {
    const { updatedPantry } = run();
    const gehaktEntries = updatedPantry.filter((p) => p.productId === 'prod-gehakt');
    expect(gehaktEntries).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // Completed list
  // -------------------------------------------------------------------------

  it('returns a completedList with completedAt set to now', () => {
    const { completedList } = run();
    expect(completedList.completedAt).toBe(now);
  });

  it('completedList preserves all original items', () => {
    const { completedList } = run();
    expect(completedList.items).toHaveLength(shoppingList.items.length);
  });

  it('completedList preserves the original list id and createdAt', () => {
    const { completedList } = run();
    expect(completedList.id).toBe(shoppingList.id);
    expect(completedList.createdAt).toBe(shoppingList.createdAt);
  });

  // -------------------------------------------------------------------------
  // Remaining list
  // -------------------------------------------------------------------------

  it('keeps unchecked items in the remaining list', () => {
    const { remainingList } = run();
    expect(remainingList.items).toHaveLength(1);
    expect(remainingList.items[0]?.productId).toBe('prod-melk');
  });

  it('remainingList has no completedAt (stays active)', () => {
    const { remainingList } = run();
    expect(remainingList.completedAt).toBeUndefined();
  });

  it('remainingList keeps the original list id', () => {
    const { remainingList } = run();
    expect(remainingList.id).toBe(shoppingList.id);
  });

  it('remaining list contains all items when nothing is checked', () => {
    const allUnchecked: ShoppingList = {
      ...shoppingList,
      items: shoppingList.items.map((i) => ({ ...i, status: 'unchecked' as const })),
    };
    const { remainingList } = run({ list: allUnchecked });
    expect(remainingList.items).toHaveLength(3);
  });

  // -------------------------------------------------------------------------
  // Immutability
  // -------------------------------------------------------------------------

  it('does not mutate the original shopping list', () => {
    run();
    expect(shoppingList.items).toHaveLength(3);
    expect(shoppingList.completedAt).toBeUndefined();
  });

  it('does not mutate the original pantry items array', () => {
    run();
    expect(pantryItems[0]?.status).toBe(PantryStatus.out);
  });

  it('does not mutate the original purchase history array', () => {
    run();
    expect(existingHistory).toHaveLength(1);
  });
});

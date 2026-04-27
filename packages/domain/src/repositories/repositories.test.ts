import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter, InMemoryStorageBackend } from '../storage/local-storage.js';
import { ProductRepository } from './products.js';
import { PantryItemRepository } from './pantry-items.js';
import { RecipeRepository } from './recipes.js';
import { MealPlanRepository } from './meal-plans.js';
import { FreezerItemRepository } from './freezer-items.js';
import { ShoppingListRepository } from './shopping-lists.js';
import { PurchaseHistoryRepository } from './purchase-history.js';
import { seedStorage } from './seed.js';
import * as fixtures from '../fixtures.js';
import type { Product } from '../product.js';
import { ProductCategory, Unit } from '../product.js';
import type { PantryItem } from '../pantry.js';
import { PantryStatus } from '../pantry.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAdapter(): { adapter: LocalStorageAdapter; backend: InMemoryStorageBackend } {
  const backend = new InMemoryStorageBackend();
  return { adapter: new LocalStorageAdapter(backend), backend };
}

const product = (id: string): Product => ({
  id,
  name: `Product ${id}`,
  category: ProductCategory.houdbaar,
  defaultUnit: Unit.stuk,
});

const pantryItem = (productId: string): PantryItem => ({
  productId,
  status: PantryStatus.in_house,
  lastUpdatedAt: '2026-04-27T00:00:00Z',
});

// ---------------------------------------------------------------------------
// BaseRepository via ProductRepository
// ---------------------------------------------------------------------------

describe('ProductRepository', () => {
  let repo: ProductRepository;

  beforeEach(() => {
    const { adapter } = makeAdapter();
    repo = new ProductRepository(adapter);
  });

  it('returns an empty array when no data has been stored', () => {
    expect(repo.getAll()).toEqual([]);
  });

  it('save / getAll roundtrip', () => {
    repo.save(product('p1'));
    repo.save(product('p2'));
    expect(repo.getAll()).toHaveLength(2);
  });

  it('getById returns the matching entity', () => {
    repo.save(product('p1'));
    expect(repo.getById('p1')).toMatchObject({ id: 'p1' });
  });

  it('getById returns undefined for an unknown id', () => {
    expect(repo.getById('nope')).toBeUndefined();
  });

  it('save updates an existing entity (upsert)', () => {
    repo.save(product('p1'));
    repo.save({ ...product('p1'), name: 'Updated' });
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getById('p1')?.name).toBe('Updated');
  });

  it('delete removes the entity', () => {
    repo.save(product('p1'));
    repo.save(product('p2'));
    repo.delete('p1');
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getById('p1')).toBeUndefined();
  });

  it('delete is a no-op for an unknown id', () => {
    repo.save(product('p1'));
    repo.delete('unknown');
    expect(repo.getAll()).toHaveLength(1);
  });

  it('replaceAll overwrites the collection', () => {
    repo.save(product('old'));
    repo.replaceAll([product('new1'), product('new2')]);
    expect(repo.getAll()).toHaveLength(2);
    expect(repo.getById('old')).toBeUndefined();
  });

  it('replaceAll with an empty array clears the collection', () => {
    repo.save(product('p1'));
    repo.replaceAll([]);
    expect(repo.getAll()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// No mutation of input data
// ---------------------------------------------------------------------------

describe('no mutation of input data', () => {
  it('save does not store a reference to the original object', () => {
    const { adapter } = makeAdapter();
    const repo = new ProductRepository(adapter);
    const p = product('p1');
    repo.save(p);
    p.name = 'mutated externally';
    expect(repo.getById('p1')?.name).toBe('Product p1');
  });

  it('getAll does not return a live reference to stored data', () => {
    const { adapter } = makeAdapter();
    const repo = new ProductRepository(adapter);
    repo.save(product('p1'));
    const all = repo.getAll();
    if (all[0]) all[0].name = 'mutated';
    expect(repo.getById('p1')?.name).toBe('Product p1');
  });

  it('replaceAll does not store references to the input array items', () => {
    const { adapter } = makeAdapter();
    const repo = new ProductRepository(adapter);
    const items = [product('p1')];
    repo.replaceAll(items);
    if (items[0]) items[0].name = 'mutated';
    expect(repo.getById('p1')?.name).toBe('Product p1');
  });
});

// ---------------------------------------------------------------------------
// PantryItemRepository — keyed by productId (not id)
// ---------------------------------------------------------------------------

describe('PantryItemRepository', () => {
  let repo: PantryItemRepository;

  beforeEach(() => {
    const { adapter } = makeAdapter();
    repo = new PantryItemRepository(adapter);
  });

  it('save / getById roundtrip using productId as key', () => {
    repo.save(pantryItem('prod-melk'));
    expect(repo.getById('prod-melk')).toMatchObject({ productId: 'prod-melk' });
  });

  it('upserts by productId', () => {
    repo.save(pantryItem('prod-melk'));
    repo.save({ ...pantryItem('prod-melk'), status: PantryStatus.out });
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getById('prod-melk')?.status).toBe(PantryStatus.out);
  });

  it('delete by productId', () => {
    repo.save(pantryItem('prod-melk'));
    repo.delete('prod-melk');
    expect(repo.getAll()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// All other repositories — smoke test save / getAll roundtrip
// ---------------------------------------------------------------------------

describe('RecipeRepository', () => {
  it('save / getAll roundtrip', () => {
    const { adapter } = makeAdapter();
    const repo = new RecipeRepository(adapter);
    repo.save(fixtures.recipeChili);
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getById('recipe-chili')).toMatchObject({ id: 'recipe-chili' });
  });
});

describe('MealPlanRepository', () => {
  it('save / getAll roundtrip', () => {
    const { adapter } = makeAdapter();
    const repo = new MealPlanRepository(adapter);
    repo.save(fixtures.mealPlanWeek);
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getById('mp-2026-w17')).toMatchObject({ id: 'mp-2026-w17' });
  });
});

describe('FreezerItemRepository', () => {
  it('save / getAll roundtrip', () => {
    const { adapter } = makeAdapter();
    const repo = new FreezerItemRepository(adapter);
    for (const item of fixtures.freezerItems) repo.save(item);
    expect(repo.getAll()).toHaveLength(fixtures.freezerItems.length);
  });
});

describe('ShoppingListRepository', () => {
  it('save / getAll roundtrip', () => {
    const { adapter } = makeAdapter();
    const repo = new ShoppingListRepository(adapter);
    repo.save(fixtures.shoppingList);
    expect(repo.getById('sl-2026-04-26')).toMatchObject({ id: 'sl-2026-04-26' });
  });
});

describe('PurchaseHistoryRepository', () => {
  it('save / getAll roundtrip', () => {
    const { adapter } = makeAdapter();
    const repo = new PurchaseHistoryRepository(adapter);
    for (const entry of fixtures.purchaseHistory) repo.save(entry);
    expect(repo.getAll()).toHaveLength(fixtures.purchaseHistory.length);
  });
});

// ---------------------------------------------------------------------------
// seedStorage
// ---------------------------------------------------------------------------

describe('seedStorage', () => {
  it('populates all collections from fixtures when storage is empty', () => {
    const { adapter } = makeAdapter();
    seedStorage(adapter);

    expect(new ProductRepository(adapter).getAll()).toHaveLength(fixtures.products.length);
    expect(new PantryItemRepository(adapter).getAll()).toHaveLength(fixtures.pantryItems.length);
    expect(new RecipeRepository(adapter).getAll()).toHaveLength(2); // chili + pasta
    expect(new MealPlanRepository(adapter).getAll()).toHaveLength(1);
    expect(new FreezerItemRepository(adapter).getAll()).toHaveLength(fixtures.freezerItems.length);
    expect(new ShoppingListRepository(adapter).getAll()).toHaveLength(1);
    expect(new PurchaseHistoryRepository(adapter).getAll()).toHaveLength(
      fixtures.purchaseHistory.length,
    );
  });

  it('does not overwrite existing data', () => {
    const { adapter } = makeAdapter();
    const repo = new ProductRepository(adapter);
    repo.replaceAll([product('custom-p1')]);

    seedStorage(adapter);

    const all = repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe('custom-p1');
  });

  it('is idempotent when called multiple times', () => {
    const { adapter } = makeAdapter();
    seedStorage(adapter);
    seedStorage(adapter);

    expect(new ProductRepository(adapter).getAll()).toHaveLength(fixtures.products.length);
  });

  it('only seeds collections that are empty', () => {
    const { adapter } = makeAdapter();
    // Pre-populate only products; other collections should be seeded.
    new ProductRepository(adapter).replaceAll([product('pre')]);

    seedStorage(adapter);

    expect(new ProductRepository(adapter).getAll()).toHaveLength(1); // unchanged
    expect(new RecipeRepository(adapter).getAll()).toHaveLength(2); // seeded
  });
});

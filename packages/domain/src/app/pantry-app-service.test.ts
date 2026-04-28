import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter, InMemoryStorageBackend } from '../storage/local-storage.js';
import { ProductRepository } from '../repositories/products.js';
import { PantryItemRepository } from '../repositories/pantry-items.js';
import { RecipeRepository } from '../repositories/recipes.js';
import { MealPlanRepository } from '../repositories/meal-plans.js';
import { FreezerItemRepository } from '../repositories/freezer-items.js';
import { ShoppingListRepository } from '../repositories/shopping-lists.js';
import { PurchaseHistoryRepository } from '../repositories/purchase-history.js';
import { PantryAppService } from './pantry-app-service.js';
import type { PantryAppServiceDeps } from './pantry-app-service.js';
import { PantryStatus, PredictionAdjustment } from '../pantry.js';
import { ProductCategory, Unit } from '../product.js';
import { MealMoment, MealPlanEntryType } from '../meal-plan.js';
import { IngredientFlag } from '../recipe.js';
import type { Product } from '../product.js';
import type { Recipe } from '../recipe.js';
import type { MealPlan, MealPlanEntry } from '../meal-plan.js';
import type { FreezerItem } from '../freezer.js';
import type { ShoppingList, ShoppingListItem } from '../shopping-list.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDeps(createId?: (prefix: string) => string): PantryAppServiceDeps {
  const backend = new InMemoryStorageBackend();
  const adapter = new LocalStorageAdapter(backend);
  const base = {
    products: new ProductRepository(adapter),
    pantryItems: new PantryItemRepository(adapter),
    recipes: new RecipeRepository(adapter),
    mealPlans: new MealPlanRepository(adapter),
    freezerItems: new FreezerItemRepository(adapter),
    shoppingLists: new ShoppingListRepository(adapter),
    purchaseHistory: new PurchaseHistoryRepository(adapter),
  };
  return createId ? { ...base, createId } : base;
}

/** Deterministic id counter reset per test. */
function makeCounter() {
  let n = 0;
  return (prefix: string) => `${prefix}-${++n}`;
}

function makeService(createId?: (prefix: string) => string): {
  service: PantryAppService;
  deps: PantryAppServiceDeps;
} {
  const deps = makeDeps(createId);
  const service = new PantryAppService(deps);
  return { service, deps };
}

// Minimal fixture helpers
const product = (id: string, overrides: Partial<Product> = {}): Product => ({
  id,
  name: `Product ${id}`,
  category: ProductCategory.houdbaar,
  defaultUnit: Unit.stuk,
  ...overrides,
});

const recipe = (id: string, overrides: Partial<Recipe> = {}): Recipe => ({
  id,
  name: `Recipe ${id}`,
  ingredients: [],
  ...overrides,
});

const freezerItem = (id: string, portions = 3): FreezerItem => ({
  id,
  name: `Freezer ${id}`,
  portions,
  createdAt: '2026-04-01T00:00:00Z',
});

const NOW = '2026-04-27T12:00:00Z';

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

describe('PantryAppService — Products', () => {
  let service: PantryAppService;
  let counter: (p: string) => string;

  beforeEach(() => {
    counter = makeCounter();
    ({ service } = makeService(counter));
  });

  it('getProducts returns empty array initially', () => {
    expect(service.getProducts()).toEqual([]);
  });

  it('addProduct saves a product with a generated id', () => {
    const p = service.addProduct({ name: 'Appel', category: ProductCategory.groente_fruit });
    expect(p.id).toBe('prod-1');
    expect(service.getProducts()).toHaveLength(1);
    expect(service.getProducts()[0]?.name).toBe('Appel');
  });

  it('addProduct returns a clone — mutating result does not affect stored data', () => {
    const p = service.addProduct({ name: 'Appel', category: ProductCategory.groente_fruit });
    p.name = 'Mutated';
    expect(service.getProducts()[0]?.name).toBe('Appel');
  });

  it('updateProduct updates an existing product', () => {
    service.addProduct({ name: 'Appel', category: ProductCategory.groente_fruit });
    const stored = service.getProducts()[0]!;
    service.updateProduct({ ...stored, name: 'Peer' });
    expect(service.getProducts()[0]?.name).toBe('Peer');
  });

  it('deleteProduct removes a product', () => {
    const p = service.addProduct({ name: 'Appel', category: ProductCategory.groente_fruit });
    service.deleteProduct(p.id);
    expect(service.getProducts()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Pantry
// ---------------------------------------------------------------------------

describe('PantryAppService — Pantry', () => {
  let service: PantryAppService;
  let deps: PantryAppServiceDeps;

  beforeEach(() => {
    ({ service, deps } = makeService(makeCounter()));
  });

  it('getPantryItems returns empty array initially', () => {
    expect(service.getPantryItems()).toEqual([]);
  });

  it('setPantryStatus creates a new pantry item when none exists', () => {
    const item = service.setPantryStatus('prod-melk', PantryStatus.out, NOW);
    expect(item.productId).toBe('prod-melk');
    expect(item.status).toBe(PantryStatus.out);
    expect(item.lastUpdatedAt).toBe(NOW);
    expect(service.getPantryItems()).toHaveLength(1);
  });

  it('setPantryStatus updates an existing item, preserving other fields', () => {
    deps.pantryItems.save({
      productId: 'prod-melk',
      status: PantryStatus.in_house,
      lastUpdatedAt: '2026-01-01T00:00:00Z',
      prediction: {
        lastPurchaseDates: ['2026-04-20'],
        averageIntervalDays: 7,
        adjustedIntervalDays: 7,
        nextExpectedPurchaseDate: '2026-04-27',
      },
    });
    const updated = service.setPantryStatus('prod-melk', PantryStatus.out, NOW);
    expect(updated.status).toBe(PantryStatus.out);
    expect(updated.lastUpdatedAt).toBe(NOW);
    // Prediction is preserved.
    expect(updated.prediction).toBeDefined();
    expect(service.getPantryItems()).toHaveLength(1);
  });

  it('applyPredictionAdjustment updates the prediction on an item', () => {
    deps.pantryItems.save({
      productId: 'prod-melk',
      status: PantryStatus.in_house,
      lastUpdatedAt: NOW,
      prediction: {
        lastPurchaseDates: ['2026-04-20'],
        averageIntervalDays: 8,
        adjustedIntervalDays: 8,
        nextExpectedPurchaseDate: '2026-04-28',
      },
    });
    service.applyPredictionAdjustment('prod-melk', PredictionAdjustment.faster);
    const item = service.getPantryItems().find((i) => i.productId === 'prod-melk')!;
    // faster = ×0.75 → 8 × 0.75 = 6
    expect(item.prediction?.adjustedIntervalDays).toBe(6);
  });

  it('applyPredictionAdjustment is a no-op when the item has no prediction', () => {
    deps.pantryItems.save({
      productId: 'prod-melk',
      status: PantryStatus.in_house,
      lastUpdatedAt: NOW,
    });
    // Should not throw
    expect(() =>
      service.applyPredictionAdjustment('prod-melk', PredictionAdjustment.faster),
    ).not.toThrow();
  });

  it('applyPredictionAdjustment is a no-op when the item does not exist', () => {
    expect(() =>
      service.applyPredictionAdjustment('unknown', PredictionAdjustment.faster),
    ).not.toThrow();
  });

  it('getPantrySuggestions returns items that are possibly_running_out at now', () => {
    deps.pantryItems.save({
      productId: 'prod-melk',
      status: PantryStatus.in_house,
      lastUpdatedAt: NOW,
      prediction: {
        lastPurchaseDates: ['2026-04-20'],
        averageIntervalDays: 7,
        adjustedIntervalDays: 7,
        nextExpectedPurchaseDate: '2026-04-25', // in the past → running out
      },
    });
    deps.pantryItems.save({
      productId: 'prod-pasta',
      status: PantryStatus.in_house,
      lastUpdatedAt: NOW,
      prediction: {
        lastPurchaseDates: ['2026-04-26'],
        averageIntervalDays: 7,
        adjustedIntervalDays: 7,
        nextExpectedPurchaseDate: '2026-05-03', // in the future → fine
      },
    });
    const suggestions = service.getPantrySuggestions(NOW);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.productId).toBe('prod-melk');
  });

  it('resetPurchaseHistory removes all history entries for a product', () => {
    deps.purchaseHistory.save({ id: 'ph-1', productId: 'prod-melk', purchasedAt: NOW });
    deps.purchaseHistory.save({ id: 'ph-2', productId: 'prod-melk', purchasedAt: NOW });
    deps.purchaseHistory.save({ id: 'ph-3', productId: 'prod-pasta', purchasedAt: NOW });

    service.resetPurchaseHistory('prod-melk');

    const history = service.getPurchaseHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.productId).toBe('prod-pasta');
  });
});

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

describe('PantryAppService — Recipes', () => {
  let service: PantryAppService;
  let counter: (p: string) => string;

  beforeEach(() => {
    counter = makeCounter();
    ({ service } = makeService(counter));
  });

  it('getRecipes returns empty array initially', () => {
    expect(service.getRecipes()).toEqual([]);
  });

  it('addRecipe saves a recipe with a generated id', () => {
    const r = service.addRecipe({ name: 'Stamppot', ingredients: [] });
    expect(r.id).toBe('recipe-1');
    expect(service.getRecipes()).toHaveLength(1);
  });

  it('updateRecipe updates an existing recipe', () => {
    const r = service.addRecipe({ name: 'Stamppot', ingredients: [] });
    service.updateRecipe({ ...r, name: 'Stamppot Boerenkool' });
    expect(service.getRecipes()[0]?.name).toBe('Stamppot Boerenkool');
  });

  it('duplicateRecipe creates a copy with a new id and "(kopie)" in the name', () => {
    service.addRecipe({ name: 'Stamppot', ingredients: [] });
    const original = service.getRecipes()[0]!;
    const copy = service.duplicateRecipe(original.id);

    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Stamppot (kopie)');
    expect(service.getRecipes()).toHaveLength(2);
  });

  it('duplicateRecipe copies the ingredients', () => {
    const withIngredients: Omit<Recipe, 'id'> = {
      name: 'Pasta',
      ingredients: [
        { productId: 'prod-pasta', quantity: 400, unit: Unit.gram, flags: [IngredientFlag.fresh] },
      ],
    };
    service.addRecipe(withIngredients);
    const original = service.getRecipes()[0]!;
    const copy = service.duplicateRecipe(original.id);

    expect(copy.ingredients).toHaveLength(1);
    expect(copy.ingredients[0]?.productId).toBe('prod-pasta');
  });

  it('duplicateRecipe throws when the source recipe is not found', () => {
    expect(() => service.duplicateRecipe('does-not-exist')).toThrow('Recipe not found');
  });

  it('deleteRecipe removes a recipe', () => {
    const r = service.addRecipe({ name: 'Stamppot', ingredients: [] });
    service.deleteRecipe(r.id);
    expect(service.getRecipes()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Meal plan
// ---------------------------------------------------------------------------

describe('PantryAppService — Meal plan', () => {
  let service: PantryAppService;
  let counter: (p: string) => string;

  beforeEach(() => {
    counter = makeCounter();
    ({ service } = makeService(counter));
  });

  it('getMealPlan returns undefined when no plan exists for the week', () => {
    expect(service.getMealPlan('2026-04-26')).toBeUndefined();
  });

  it('saveMealPlan stores a plan that can be retrieved by weekStartDate', () => {
    const plan: MealPlan = { id: 'mp-1', weekStartDate: '2026-04-26', entries: [] };
    service.saveMealPlan(plan);
    expect(service.getMealPlan('2026-04-26')).toMatchObject({ id: 'mp-1' });
  });

  it('setMealPlanEntry creates a new plan when none exists', () => {
    const entry: Omit<MealPlanEntry, 'id'> = {
      date: '2026-04-27',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.recipe,
      recipeId: 'recipe-1',
      quantity: 1,
    };
    const plan = service.setMealPlanEntry('2026-04-26', entry);
    expect(plan.weekStartDate).toBe('2026-04-26');
    expect(plan.entries).toHaveLength(1);
    expect(plan.entries[0]?.id).toBeDefined();
  });

  it('setMealPlanEntry appends a new entry to an existing plan', () => {
    const base: MealPlan = { id: 'mp-x', weekStartDate: '2026-04-26', entries: [] };
    service.saveMealPlan(base);
    service.setMealPlanEntry('2026-04-26', {
      date: '2026-04-27',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.open,
      quantity: 1,
    });
    expect(service.getMealPlan('2026-04-26')?.entries).toHaveLength(1);
  });

  it('setMealPlanEntry replaces an existing entry when the same id is provided', () => {
    const base: MealPlan = {
      id: 'mp-x',
      weekStartDate: '2026-04-26',
      entries: [
        {
          id: 'mpe-existing',
          date: '2026-04-27',
          moment: MealMoment.dinner,
          type: MealPlanEntryType.open,
          quantity: 1,
        },
      ],
    };
    service.saveMealPlan(base);
    service.setMealPlanEntry('2026-04-26', {
      id: 'mpe-existing',
      date: '2026-04-27',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.recipe,
      recipeId: 'recipe-1',
      quantity: 1,
    });
    const entries = service.getMealPlan('2026-04-26')?.entries ?? [];
    expect(entries).toHaveLength(1);
    expect(entries[0]?.type).toBe(MealPlanEntryType.recipe);
  });

  it('clearMealPlanEntry removes the specified entry', () => {
    const plan: MealPlan = {
      id: 'mp-x',
      weekStartDate: '2026-04-26',
      entries: [
        {
          id: 'mpe-a',
          date: '2026-04-26',
          moment: MealMoment.dinner,
          type: MealPlanEntryType.open,
          quantity: 1,
        },
        {
          id: 'mpe-b',
          date: '2026-04-27',
          moment: MealMoment.dinner,
          type: MealPlanEntryType.open,
          quantity: 1,
        },
      ],
    };
    service.saveMealPlan(plan);
    service.clearMealPlanEntry('2026-04-26', 'mpe-a');
    const entries = service.getMealPlan('2026-04-26')?.entries ?? [];
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe('mpe-b');
  });

  it('clearMealPlanEntry returns undefined when no plan exists', () => {
    expect(service.clearMealPlanEntry('2099-01-01', 'mpe-x')).toBeUndefined();
  });

  it('copyPreviousWeek copies all entries with shifted dates and new ids', () => {
    const prevPlan: MealPlan = {
      id: 'mp-prev',
      weekStartDate: '2026-04-19',
      entries: [
        {
          id: 'mpe-orig-1',
          date: '2026-04-19',
          moment: MealMoment.dinner,
          type: MealPlanEntryType.recipe,
          recipeId: 'recipe-1',
          quantity: 1,
        },
        {
          id: 'mpe-orig-2',
          date: '2026-04-21',
          moment: MealMoment.dinner,
          type: MealPlanEntryType.eating_elsewhere,
          quantity: 1,
        },
      ],
    };
    service.saveMealPlan(prevPlan);

    const copied = service.copyPreviousWeek('2026-04-26');

    expect(copied).toBeDefined();
    expect(copied!.weekStartDate).toBe('2026-04-26');
    expect(copied!.entries).toHaveLength(2);

    // Dates shifted by +7
    expect(copied!.entries[0]?.date).toBe('2026-04-26');
    expect(copied!.entries[1]?.date).toBe('2026-04-28');

    // New ids, different from original
    expect(copied!.entries[0]?.id).not.toBe('mpe-orig-1');
    expect(copied!.entries[1]?.id).not.toBe('mpe-orig-2');

    // Saved and retrievable
    expect(service.getMealPlan('2026-04-26')).toBeDefined();
  });

  it('copyPreviousWeek returns undefined when no previous week plan exists', () => {
    expect(service.copyPreviousWeek('2026-04-26')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Freezer
// ---------------------------------------------------------------------------

describe('PantryAppService — Freezer', () => {
  let service: PantryAppService;
  let deps: PantryAppServiceDeps;

  beforeEach(() => {
    ({ service, deps } = makeService(makeCounter()));
  });

  it('getFreezerItems returns empty array initially', () => {
    expect(service.getFreezerItems()).toEqual([]);
  });

  it('addFreezerItem saves a freezer item with a generated id', () => {
    const item = service.addFreezerItem({ name: 'Chili', portions: 3, createdAt: NOW });
    expect(item.id).toBeDefined();
    expect(service.getFreezerItems()).toHaveLength(1);
  });

  it('updateFreezerItem updates an existing freezer item', () => {
    deps.freezerItems.save(freezerItem('fi-1'));
    service.updateFreezerItem({ ...freezerItem('fi-1'), portions: 10 });
    expect(service.getFreezerItems()[0]?.portions).toBe(10);
  });

  it('consumeFreezerItem reduces portions by the given quantity', () => {
    deps.freezerItems.save(freezerItem('fi-1', 3));
    service.consumeFreezerItem('fi-1', 1);
    expect(service.getFreezerItems()[0]?.portions).toBe(2);
  });

  it('consumeFreezerItem removes the item when portions reach zero', () => {
    deps.freezerItems.save(freezerItem('fi-1', 1));
    service.consumeFreezerItem('fi-1', 1);
    expect(service.getFreezerItems()).toHaveLength(0);
  });

  it('consumeFreezerItem is a no-op when the item does not exist', () => {
    deps.freezerItems.save(freezerItem('fi-1', 3));
    service.consumeFreezerItem('unknown', 1);
    expect(service.getFreezerItems()[0]?.portions).toBe(3);
  });

  it('deleteFreezerItem removes the item', () => {
    deps.freezerItems.save(freezerItem('fi-1'));
    service.deleteFreezerItem('fi-1');
    expect(service.getFreezerItems()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Shopping list
// ---------------------------------------------------------------------------

describe('PantryAppService — Shopping list', () => {
  let service: PantryAppService;
  let deps: PantryAppServiceDeps;

  beforeEach(() => {
    ({ service, deps } = makeService(makeCounter()));
  });

  it('getActiveShoppingList returns undefined when no list exists', () => {
    expect(service.getActiveShoppingList()).toBeUndefined();
  });

  it('generateShoppingListFromCurrentPlan creates a list from an empty plan', () => {
    const list = service.generateShoppingListFromCurrentPlan('2026-04-26', NOW);
    expect(list.items).toEqual([]);
    expect(list.completedAt).toBeUndefined();
    expect(service.getActiveShoppingList()?.id).toBe(list.id);
  });

  it('generateShoppingListFromCurrentPlan includes recipe ingredients from meal plan', () => {
    deps.products.save(
      product('prod-gehakt', { defaultUnit: Unit.gram, category: ProductCategory.vlees_vis }),
    );

    const r = recipe('recipe-pasta', {
      ingredients: [
        { productId: 'prod-gehakt', quantity: 500, unit: Unit.gram, flags: [IngredientFlag.fresh] },
      ],
    });
    deps.recipes.save(r);

    const plan: MealPlan = {
      id: 'mp-1',
      weekStartDate: '2026-04-26',
      entries: [
        {
          id: 'mpe-1',
          date: '2026-04-26',
          moment: MealMoment.dinner,
          type: MealPlanEntryType.recipe,
          recipeId: 'recipe-pasta',
          quantity: 1,
        },
      ],
    };
    deps.mealPlans.save(plan);

    const list = service.generateShoppingListFromCurrentPlan('2026-04-26', NOW);
    expect(list.items.some((i) => i.productId === 'prod-gehakt')).toBe(true);
  });

  it('generateShoppingListFromCurrentPlan carries over manual items from existing active list', () => {
    // Seed an active list with a manual item.
    const manualItem: ShoppingListItem = {
      id: 'sli-manual',
      productId: 'prod-brood',
      quantity: 1,
      unit: Unit.stuk,
      category: ProductCategory.brood,
      sources: [{ type: 'manual' }],
      status: 'unchecked',
      uncertainty: 'certain',
    };
    const activeList: ShoppingList = {
      id: 'sl-old',
      createdAt: NOW,
      items: [manualItem],
    };
    deps.shoppingLists.save(activeList);

    const list = service.generateShoppingListFromCurrentPlan('2026-04-26', NOW);
    expect(list.items.some((i) => i.productId === 'prod-brood')).toBe(true);
    // Old list should be gone.
    expect(deps.shoppingLists.getById('sl-old')).toBeUndefined();
  });

  it('addManualShoppingItem appends an item to the active list', () => {
    service.generateShoppingListFromCurrentPlan('2026-04-26', NOW);

    const updated = service.addManualShoppingItem({
      productId: 'prod-brood',
      quantity: 1,
      unit: Unit.stuk,
      category: ProductCategory.brood,
      sources: [{ type: 'manual' }],
      status: 'unchecked',
      uncertainty: 'certain',
    });

    expect(updated.items).toHaveLength(1);
    expect(updated.items[0]?.productId).toBe('prod-brood');
    expect(updated.items[0]?.id).toBeDefined();
  });

  it('addManualShoppingItem throws when no active list exists', () => {
    expect(() =>
      service.addManualShoppingItem({
        productId: 'prod-brood',
        quantity: 1,
        unit: Unit.stuk,
        category: ProductCategory.brood,
        sources: [{ type: 'manual' }],
        status: 'unchecked',
        uncertainty: 'certain',
      }),
    ).toThrow('No active shopping list found');
  });

  it('resolveMaybeNeededItem with "add" makes the item certain', () => {
    const list: ShoppingList = {
      id: 'sl-1',
      createdAt: NOW,
      items: [
        {
          id: 'sli-1',
          productId: 'prod-melk',
          quantity: 1,
          unit: Unit.liter,
          category: ProductCategory.zuivel,
          sources: [{ type: 'pantry' }],
          status: 'unchecked',
          uncertainty: 'maybe_needed',
        },
      ],
    };
    deps.shoppingLists.save(list);

    const updated = service.resolveMaybeNeededItem('sli-1', 'add');
    expect(updated.items[0]?.uncertainty).toBe('certain');
  });

  it('resolveMaybeNeededItem with "skip" removes the item', () => {
    const list: ShoppingList = {
      id: 'sl-1',
      createdAt: NOW,
      items: [
        {
          id: 'sli-1',
          productId: 'prod-melk',
          quantity: 1,
          unit: Unit.liter,
          category: ProductCategory.zuivel,
          sources: [{ type: 'pantry' }],
          status: 'unchecked',
          uncertainty: 'maybe_needed',
        },
      ],
    };
    deps.shoppingLists.save(list);

    const updated = service.resolveMaybeNeededItem('sli-1', 'skip');
    expect(updated.items).toHaveLength(0);
  });

  it('resolveMaybeNeededItem throws when item is not found', () => {
    const list: ShoppingList = { id: 'sl-1', createdAt: NOW, items: [] };
    deps.shoppingLists.save(list);
    expect(() => service.resolveMaybeNeededItem('nope', 'add')).toThrow(
      'Shopping list item not found',
    );
  });

  it('checkShoppingItem sets item status to checked', () => {
    const list: ShoppingList = {
      id: 'sl-1',
      createdAt: NOW,
      items: [
        {
          id: 'sli-1',
          productId: 'prod-melk',
          quantity: 1,
          unit: Unit.liter,
          category: ProductCategory.zuivel,
          sources: [{ type: 'pantry' }],
          status: 'unchecked',
          uncertainty: 'certain',
        },
      ],
    };
    deps.shoppingLists.save(list);

    const updated = service.checkShoppingItem('sli-1');
    expect(updated.items[0]?.status).toBe('checked');
  });

  it('uncheckShoppingItem sets item status to unchecked', () => {
    const list: ShoppingList = {
      id: 'sl-1',
      createdAt: NOW,
      items: [
        {
          id: 'sli-1',
          productId: 'prod-melk',
          quantity: 1,
          unit: Unit.liter,
          category: ProductCategory.zuivel,
          sources: [{ type: 'pantry' }],
          status: 'checked',
          uncertainty: 'certain',
        },
      ],
    };
    deps.shoppingLists.save(list);

    const updated = service.uncheckShoppingItem('sli-1');
    expect(updated.items[0]?.status).toBe('unchecked');
  });

  it('completeShoppingTrip archives the list and updates pantry', () => {
    deps.pantryItems.save({
      productId: 'prod-melk',
      status: PantryStatus.out,
      lastUpdatedAt: NOW,
    });

    const list: ShoppingList = {
      id: 'sl-1',
      createdAt: NOW,
      items: [
        {
          id: 'sli-1',
          productId: 'prod-melk',
          quantity: 1,
          unit: Unit.liter,
          category: ProductCategory.zuivel,
          sources: [{ type: 'pantry' }],
          status: 'checked',
          uncertainty: 'certain',
        },
      ],
    };
    deps.shoppingLists.save(list);

    const COMPLETE_NOW = '2026-04-27T14:00:00Z';
    const { completedList } = service.completeShoppingTrip(COMPLETE_NOW);

    // List is archived.
    expect(completedList.completedAt).toBe(COMPLETE_NOW);
    expect(service.getActiveShoppingList()).toBeUndefined();

    // Pantry updated.
    const pantry = service.getPantryItems();
    expect(pantry.find((i) => i.productId === 'prod-melk')?.status).toBe(PantryStatus.in_house);

    // History appended.
    const history = service.getPurchaseHistory();
    expect(history.some((h) => h.productId === 'prod-melk')).toBe(true);
  });

  it('completeShoppingTrip creates a remaining active list for unchecked items', () => {
    const list: ShoppingList = {
      id: 'sl-original',
      createdAt: NOW,
      items: [
        {
          id: 'sli-checked',
          productId: 'prod-melk',
          quantity: 1,
          unit: Unit.liter,
          category: ProductCategory.zuivel,
          sources: [{ type: 'pantry' }],
          status: 'checked',
          uncertainty: 'certain',
        },
        {
          id: 'sli-unchecked',
          productId: 'prod-pasta',
          quantity: 400,
          unit: Unit.gram,
          category: ProductCategory.houdbaar,
          sources: [{ type: 'pantry' }],
          status: 'unchecked',
          uncertainty: 'certain',
        },
      ],
    };
    deps.shoppingLists.save(list);

    const { remainingList } = service.completeShoppingTrip(NOW);

    // Remaining list has new id and contains only unchecked items.
    expect(remainingList.id).not.toBe('sl-original');
    expect(remainingList.items).toHaveLength(1);
    expect(remainingList.items[0]?.id).toBe('sli-unchecked');

    // Active list is the remaining list.
    expect(service.getActiveShoppingList()?.id).toBe(remainingList.id);
  });

  it('completeShoppingTrip appends a purchase history entry for each checked item', () => {
    const list: ShoppingList = {
      id: 'sl-1',
      createdAt: NOW,
      items: [
        {
          id: 'sli-1',
          productId: 'prod-melk',
          quantity: 1,
          unit: Unit.liter,
          category: ProductCategory.zuivel,
          sources: [{ type: 'pantry' }],
          status: 'checked',
          uncertainty: 'certain',
        },
        {
          id: 'sli-2',
          productId: 'prod-pasta',
          quantity: 400,
          unit: Unit.gram,
          category: ProductCategory.houdbaar,
          sources: [{ type: 'pantry' }],
          status: 'checked',
          uncertainty: 'certain',
        },
      ],
    };
    deps.shoppingLists.save(list);

    service.completeShoppingTrip(NOW);

    const history = service.getPurchaseHistory();
    expect(history).toHaveLength(2);
    expect(history.map((h) => h.productId).sort()).toEqual(['prod-melk', 'prod-pasta'].sort());
  });

  it('completeShoppingTrip throws when no active list exists', () => {
    expect(() => service.completeShoppingTrip(NOW)).toThrow('No active shopping list found');
  });
});

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

describe('PantryAppService — History', () => {
  let service: PantryAppService;
  let deps: PantryAppServiceDeps;

  beforeEach(() => {
    ({ service, deps } = makeService(makeCounter()));
  });

  it('getShoppingHistory returns only completed lists', () => {
    deps.shoppingLists.save({ id: 'sl-active', createdAt: NOW, items: [] });
    deps.shoppingLists.save({
      id: 'sl-done',
      createdAt: NOW,
      completedAt: NOW,
      items: [],
    });

    const history = service.getShoppingHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.id).toBe('sl-done');
  });

  it('getPurchaseHistory returns all purchase entries', () => {
    deps.purchaseHistory.save({ id: 'ph-1', productId: 'prod-melk', purchasedAt: NOW });
    deps.purchaseHistory.save({ id: 'ph-2', productId: 'prod-pasta', purchasedAt: NOW });
    expect(service.getPurchaseHistory()).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// No direct mutation leaks
// ---------------------------------------------------------------------------

describe('PantryAppService — no direct mutation leaks', () => {
  it('mutating the array from getProducts does not affect stored data', () => {
    const { service, deps } = makeService(makeCounter());
    deps.products.save(product('p1'));
    const all = service.getProducts();
    all.pop();
    expect(service.getProducts()).toHaveLength(1);
  });

  it('mutating an item returned by addProduct does not affect stored data', () => {
    const { service } = makeService(makeCounter());
    const p = service.addProduct({ name: 'Appel', category: ProductCategory.groente_fruit });
    p.name = 'Mutated';
    expect(service.getProducts()[0]?.name).toBe('Appel');
  });

  it('mutating an item returned by getFreezerItems does not affect stored data', () => {
    const { service, deps } = makeService(makeCounter());
    deps.freezerItems.save(freezerItem('fi-1', 5));
    const items = service.getFreezerItems();
    items[0]!.portions = 99;
    expect(service.getFreezerItems()[0]?.portions).toBe(5);
  });
});

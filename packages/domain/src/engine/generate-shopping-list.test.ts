import { describe, it, expect } from 'vitest';
import { generateShoppingList } from './generate-shopping-list.js';
import type { GenerateShoppingListInput } from './generate-shopping-list.js';
import { PantryStatus } from '../pantry.js';
import type { PantryItem } from '../pantry.js';
import { Unit, ProductCategory } from '../product.js';
import type { Product } from '../product.js';
import { IngredientFlag } from '../recipe.js';
import type { Recipe } from '../recipe.js';
import { MealMoment, MealPlanEntryType } from '../meal-plan.js';
import type { MealPlan } from '../meal-plan.js';
import type { FreezerItem } from '../freezer.js';
import type { ShoppingListItem } from '../shopping-list.js';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const now = '2026-04-26T08:00:00Z';

const products: Product[] = [
  {
    id: 'prod-gehakt',
    name: 'Rundergehakt',
    category: ProductCategory.vlees_vis,
    defaultUnit: Unit.gram,
  },
  { id: 'prod-ui', name: 'Ui', category: ProductCategory.groente_fruit, defaultUnit: Unit.stuk },
  { id: 'prod-melk', name: 'Melk', category: ProductCategory.zuivel, defaultUnit: Unit.liter },
  { id: 'prod-pasta', name: 'Pasta', category: ProductCategory.houdbaar, defaultUnit: Unit.gram },
  {
    id: 'prod-knoflook',
    name: 'Knoflook',
    category: ProductCategory.groente_fruit,
    defaultUnit: Unit.stuk,
  },
  {
    id: 'prod-kidneybonen',
    name: 'Kidneybonen',
    category: ProductCategory.houdbaar,
    defaultUnit: Unit.blik,
  },
  {
    id: 'prod-olijfolie',
    name: 'Olijfolie',
    category: ProductCategory.houdbaar,
    defaultUnit: Unit.fles,
  },
  {
    id: 'prod-parmezaan',
    name: 'Parmezaan',
    category: ProductCategory.zuivel,
    defaultUnit: Unit.gram,
  },
];

const pantryItems: PantryItem[] = [
  {
    productId: 'prod-ui',
    status: PantryStatus.possibly_running_out,
    lastUpdatedAt: '2026-04-23T18:00:00Z',
  },
  { productId: 'prod-gehakt', status: PantryStatus.out, lastUpdatedAt: '2026-04-24T09:00:00Z' },
  {
    productId: 'prod-melk',
    status: PantryStatus.possibly_running_out,
    lastUpdatedAt: '2026-04-25T07:30:00Z',
  },
  { productId: 'prod-pasta', status: PantryStatus.in_house, lastUpdatedAt: '2026-04-19T10:00:00Z' },
  {
    productId: 'prod-knoflook',
    status: PantryStatus.in_house,
    lastUpdatedAt: '2026-04-19T10:00:00Z',
  },
  {
    productId: 'prod-kidneybonen',
    status: PantryStatus.out,
    lastUpdatedAt: '2026-04-22T20:00:00Z',
  },
  {
    productId: 'prod-olijfolie',
    status: PantryStatus.possibly_running_out,
    lastUpdatedAt: '2026-04-24T19:00:00Z',
  },
  { productId: 'prod-parmezaan', status: PantryStatus.out, lastUpdatedAt: '2026-04-25T08:00:00Z' },
];

const recipeChili: Recipe = {
  id: 'recipe-chili',
  name: 'Chili con carne',
  ingredients: [
    { productId: 'prod-gehakt', quantity: 500, unit: Unit.gram, flags: [IngredientFlag.fresh] },
    { productId: 'prod-ui', quantity: 2, unit: Unit.stuk, flags: [IngredientFlag.pantry_item] },
    {
      productId: 'prod-knoflook',
      quantity: 2,
      unit: Unit.stuk,
      flags: [IngredientFlag.pantry_item],
    },
    {
      productId: 'prod-kidneybonen',
      quantity: 1,
      unit: Unit.blik,
      flags: [IngredientFlag.pantry_item],
    },
  ],
};

const recipePasta: Recipe = {
  id: 'recipe-pasta',
  name: 'Pasta met tomatensaus',
  ingredients: [
    {
      productId: 'prod-pasta',
      quantity: 400,
      unit: Unit.gram,
      flags: [IngredientFlag.pantry_item],
    },
    { productId: 'prod-ui', quantity: 1, unit: Unit.stuk, flags: [IngredientFlag.pantry_item] },
    {
      productId: 'prod-knoflook',
      quantity: 1,
      unit: Unit.stuk,
      flags: [IngredientFlag.pantry_item],
    },
    {
      productId: 'prod-olijfolie',
      quantity: 30,
      unit: Unit.milliliter,
      flags: [IngredientFlag.pantry_item],
    },
    {
      productId: 'prod-parmezaan',
      quantity: 50,
      unit: Unit.gram,
      flags: [IngredientFlag.fresh, IngredientFlag.optional],
    },
  ],
};

const freezerItems: FreezerItem[] = [
  { id: 'fi-chili', name: 'Chili con carne', portions: 3, createdAt: '2026-04-19T20:00:00Z' },
];

const mealPlan: MealPlan = {
  id: 'mp-test',
  weekStartDate: '2026-04-26',
  entries: [
    {
      id: 'mpe-1',
      date: '2026-04-26',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.recipe,
      recipeId: 'recipe-chili',
      quantity: 1,
    },
    {
      id: 'mpe-2',
      date: '2026-04-27',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.freezer,
      freezerItemId: 'fi-chili',
      quantity: 1,
    },
    {
      id: 'mpe-3',
      date: '2026-04-28',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.recipe,
      recipeId: 'recipe-pasta',
      quantity: 1,
    },
    {
      id: 'mpe-4',
      date: '2026-04-29',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.eating_elsewhere,
      quantity: 1,
    },
    {
      id: 'mpe-5',
      date: '2026-04-30',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.ordering_food,
      quantity: 1,
    },
    {
      id: 'mpe-6',
      date: '2026-05-01',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.open,
      quantity: 1,
    },
    {
      id: 'mpe-7',
      date: '2026-05-02',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.recipe,
      recipeId: 'recipe-pasta',
      quantity: 1,
    },
  ],
};

const baseInput: GenerateShoppingListInput = {
  pantrySuggestions: [],
  pantryItems,
  mealPlan,
  recipes: [recipeChili, recipePasta],
  freezerItems,
  manualItems: [],
  products,
  now,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateShoppingList', () => {
  describe('pantry suggestions', () => {
    it('adds a maybe_needed item for each pantry suggestion', () => {
      const input: GenerateShoppingListInput = {
        ...baseInput,
        pantrySuggestions: [pantryItems.find((p) => p.productId === 'prod-melk')!],
        mealPlan: { ...mealPlan, entries: [] },
      };
      const list = generateShoppingList(input);
      const melk = list.items.find((i) => i.productId === 'prod-melk');
      expect(melk).toBeDefined();
      expect(melk!.uncertainty).toBe('maybe_needed');
      expect(melk!.sources[0].type).toBe('pantry');
    });

    it('uses the product default unit for pantry suggestion items', () => {
      const input: GenerateShoppingListInput = {
        ...baseInput,
        pantrySuggestions: [pantryItems.find((p) => p.productId === 'prod-melk')!],
        mealPlan: { ...mealPlan, entries: [] },
      };
      const list = generateShoppingList(input);
      const melk = list.items.find((i) => i.productId === 'prod-melk');
      expect(melk!.unit).toBe(Unit.liter);
    });
  });

  describe('recipe ingredients — flag behaviour', () => {
    it('always adds fresh ingredients as certain', () => {
      const input: GenerateShoppingListInput = { ...baseInput, pantrySuggestions: [] };
      const list = generateShoppingList(input);
      const gehakt = list.items.find((i) => i.productId === 'prod-gehakt');
      expect(gehakt).toBeDefined();
      expect(gehakt!.uncertainty).toBe('certain');
    });

    it('skips in_house pantry items', () => {
      const input: GenerateShoppingListInput = { ...baseInput, pantrySuggestions: [] };
      const list = generateShoppingList(input);
      // prod-knoflook is in_house — should not appear
      const knoflook = list.items.find((i) => i.productId === 'prod-knoflook');
      expect(knoflook).toBeUndefined();
    });

    it('skips in_house pantry items even when used in multiple recipes', () => {
      const input: GenerateShoppingListInput = { ...baseInput, pantrySuggestions: [] };
      const list = generateShoppingList(input);
      // prod-pasta is in_house and used in recipe-pasta (twice)
      const pasta = list.items.find((i) => i.productId === 'prod-pasta');
      expect(pasta).toBeUndefined();
    });

    it('adds out pantry items as certain', () => {
      const input: GenerateShoppingListInput = { ...baseInput, pantrySuggestions: [] };
      const list = generateShoppingList(input);
      const kidneybonen = list.items.find((i) => i.productId === 'prod-kidneybonen');
      expect(kidneybonen).toBeDefined();
      expect(kidneybonen!.uncertainty).toBe('certain');
    });

    it('adds possibly_running_out pantry items as maybe_needed', () => {
      const input: GenerateShoppingListInput = { ...baseInput, pantrySuggestions: [] };
      const list = generateShoppingList(input);
      // prod-ui is possibly_running_out and used in both chili + pasta
      const ui = list.items.find((i) => i.productId === 'prod-ui');
      expect(ui).toBeDefined();
      expect(ui!.uncertainty).toBe('maybe_needed');
    });

    it('adds optional ingredients as maybe_needed regardless of pantry status', () => {
      const input: GenerateShoppingListInput = { ...baseInput, pantrySuggestions: [] };
      const list = generateShoppingList(input);
      const parmezaan = list.items.find((i) => i.productId === 'prod-parmezaan');
      expect(parmezaan).toBeDefined();
      expect(parmezaan!.uncertainty).toBe('maybe_needed');
    });
  });

  describe('meal plan entry types', () => {
    it('generates no items for freezer entries', () => {
      const freezerEntry = mealPlan.entries[1];
      const freezerOnlyPlan: MealPlan = {
        ...mealPlan,
        entries: freezerEntry ? [freezerEntry] : [],
      };
      const list = generateShoppingList({ ...baseInput, mealPlan: freezerOnlyPlan });
      expect(list.items).toHaveLength(0);
    });

    it('generates no items for eating_elsewhere, ordering_food, and open entries', () => {
      const ignoredPlan: MealPlan = {
        ...mealPlan,
        entries: mealPlan.entries.slice(3, 6), // eating_elsewhere, ordering_food, open
      };
      const list = generateShoppingList({ ...baseInput, mealPlan: ignoredPlan });
      expect(list.items).toHaveLength(0);
    });
  });

  describe('aggregation', () => {
    it('aggregates the same product+unit across multiple recipe entries', () => {
      const input: GenerateShoppingListInput = { ...baseInput, pantrySuggestions: [] };
      const list = generateShoppingList(input);
      // prod-ui (stuk) appears in chili (2) + pasta (1) + pasta (1) = 4 total
      const ui = list.items.find((i) => i.productId === 'prod-ui' && i.unit === Unit.stuk);
      expect(ui).toBeDefined();
      expect(ui!.quantity).toBe(4); // 2 (chili) + 1 (pasta Mon) + 1 (pasta Fri)
    });

    it('does not merge items with different units', () => {
      const input: GenerateShoppingListInput = { ...baseInput, pantrySuggestions: [] };
      const list = generateShoppingList(input);
      // prod-olijfolie appears in milliliter (from recipe) — should stay as milliliter
      const olie = list.items.find((i) => i.productId === 'prod-olijfolie');
      expect(olie!.unit).toBe(Unit.milliliter);
    });

    it('olijfolie quantity is 60 ml (30 ml × 2 pasta entries)', () => {
      const input: GenerateShoppingListInput = { ...baseInput, pantrySuggestions: [] };
      const list = generateShoppingList(input);
      const olie = list.items.find((i) => i.productId === 'prod-olijfolie');
      expect(olie!.quantity).toBe(60);
    });
  });

  describe('manual items', () => {
    it('includes manual items verbatim', () => {
      const manualItem: ShoppingListItem = {
        id: 'man-1',
        productId: 'prod-pasta',
        quantity: 500,
        unit: Unit.gram,
        category: ProductCategory.houdbaar,
        sources: [{ type: 'manual' }],
        status: 'unchecked',
        uncertainty: 'certain',
      };
      const list = generateShoppingList({
        ...baseInput,
        pantrySuggestions: [],
        manualItems: [manualItem],
      });
      // prod-pasta is in_house so recipe won't add it, but the manual item should appear
      const pasta = list.items.find((i) => i.productId === 'prod-pasta');
      expect(pasta).toBeDefined();
      expect(pasta!.quantity).toBe(500);
      expect(pasta!.sources[0].type).toBe('manual');
    });
  });

  describe('output structure', () => {
    it('sets createdAt to now', () => {
      const list = generateShoppingList(baseInput);
      expect(list.createdAt).toBe(now);
    });

    it('all items have status unchecked', () => {
      const list = generateShoppingList(baseInput);
      expect(list.items.every((i) => i.status === 'unchecked')).toBe(true);
    });

    it('all items have at least one source', () => {
      const list = generateShoppingList(baseInput);
      expect(list.items.every((i) => i.sources.length > 0)).toBe(true);
    });

    it('does not mutate input pantry items', () => {
      const originalStatus = pantryItems[0]?.status;
      generateShoppingList(baseInput);
      expect(pantryItems[0]?.status).toBe(originalStatus);
    });
  });

  describe('mixed scenario with pantry suggestions + recipes', () => {
    it('aggregates pantry suggestion and recipe item for the same product+unit', () => {
      const uiSuggestion = pantryItems.find((p) => p.productId === 'prod-ui')!;
      const firstEntry = mealPlan.entries[0];
      const input: GenerateShoppingListInput = {
        ...baseInput,
        pantrySuggestions: [uiSuggestion],
        mealPlan: { ...mealPlan, entries: firstEntry ? [firstEntry] : [] },
      };
      const list = generateShoppingList(input);
      const ui = list.items.find((i) => i.productId === 'prod-ui' && i.unit === Unit.stuk);
      expect(ui).toBeDefined();
      // pantry suggestion (qty 1) + chili ingredient (qty 2) = 3
      expect(ui!.quantity).toBe(3);
      // pantry suggestion is maybe_needed → aggregated item is maybe_needed
      expect(ui!.uncertainty).toBe('maybe_needed');
      expect(ui!.sources.length).toBeGreaterThanOrEqual(2);
    });
  });
});

/**
 * Example fixtures — realistic data for a Dutch household.
 * Used as test data and for local development.
 */

import type { Product } from './product.js';
import { ProductCategory, Unit } from './product.js';
import type { PantryItem } from './pantry.js';
import { PantryStatus } from './pantry.js';
import type { PurchaseHistoryEntry } from './purchase-history.js';
import { IngredientFlag } from './recipe.js';
import type { Recipe } from './recipe.js';
import type { MealPlan } from './meal-plan.js';
import { MealMoment, MealPlanEntryType } from './meal-plan.js';
import type { FreezerItem } from './freezer.js';
import type { ShoppingList } from './shopping-list.js';

// ---------------------------------------------------------------------------
// Products (10 items, realistic Dutch household)
// ---------------------------------------------------------------------------

export const products: Product[] = [
  {
    id: 'prod-ui',
    name: 'Ui',
    category: ProductCategory.groente_fruit,
    defaultUnit: Unit.stuk,
    tags: ['groente', 'basis'],
  },
  {
    id: 'prod-gehakt',
    name: 'Rundergehakt',
    category: ProductCategory.vlees_vis,
    defaultUnit: Unit.gram,
    tags: ['vlees'],
  },
  {
    id: 'prod-melk',
    name: 'Volle melk',
    category: ProductCategory.zuivel,
    defaultUnit: Unit.liter,
  },
  {
    id: 'prod-tomaten-blik',
    name: 'Gepelde tomaten (blik)',
    category: ProductCategory.houdbaar,
    defaultUnit: Unit.blik,
  },
  {
    id: 'prod-pasta',
    name: 'Penne',
    category: ProductCategory.houdbaar,
    defaultUnit: Unit.gram,
    tags: ['pasta'],
  },
  {
    id: 'prod-kidneybonen',
    name: 'Kidneybonen (blik)',
    category: ProductCategory.houdbaar,
    defaultUnit: Unit.blik,
  },
  {
    id: 'prod-knoflook',
    name: 'Knoflook',
    category: ProductCategory.groente_fruit,
    defaultUnit: Unit.stuk,
    tags: ['groente', 'basis'],
  },
  {
    id: 'prod-paprikapoeder',
    name: 'Paprikapoeder',
    category: ProductCategory.houdbaar,
    defaultUnit: Unit.pot,
    tags: ['kruid'],
  },
  {
    id: 'prod-olijfolie',
    name: 'Olijfolie',
    category: ProductCategory.houdbaar,
    defaultUnit: Unit.fles,
  },
  {
    id: 'prod-parmezaan',
    name: 'Parmezaan (geraspt)',
    category: ProductCategory.zuivel,
    defaultUnit: Unit.gram,
  },
];

// ---------------------------------------------------------------------------
// Pantry items — mixed statuses
// ---------------------------------------------------------------------------

export const pantryItems: PantryItem[] = [
  {
    productId: 'prod-ui',
    status: PantryStatus.possibly_running_out,
    lastUpdatedAt: '2026-04-23T18:00:00Z',
  },
  {
    productId: 'prod-gehakt',
    status: PantryStatus.out,
    lastUpdatedAt: '2026-04-24T09:00:00Z',
  },
  {
    productId: 'prod-melk',
    status: PantryStatus.possibly_running_out,
    lastUpdatedAt: '2026-04-25T07:30:00Z',
    prediction: {
      lastPurchaseDates: ['2026-03-28', '2026-04-04', '2026-04-11'],
      averageIntervalDays: 7,
      adjustedIntervalDays: 7,
      nextExpectedPurchaseDate: '2026-04-18',
    },
  },
  {
    productId: 'prod-tomaten-blik',
    status: PantryStatus.in_house,
    lastUpdatedAt: '2026-04-19T10:00:00Z',
  },
  {
    productId: 'prod-pasta',
    status: PantryStatus.in_house,
    lastUpdatedAt: '2026-04-19T10:00:00Z',
  },
  {
    productId: 'prod-kidneybonen',
    status: PantryStatus.out,
    lastUpdatedAt: '2026-04-22T20:00:00Z',
  },
  {
    productId: 'prod-knoflook',
    status: PantryStatus.in_house,
    lastUpdatedAt: '2026-04-19T10:00:00Z',
  },
  {
    productId: 'prod-paprikapoeder',
    status: PantryStatus.in_house,
    lastUpdatedAt: '2026-04-19T10:00:00Z',
  },
  {
    productId: 'prod-olijfolie',
    status: PantryStatus.possibly_running_out,
    lastUpdatedAt: '2026-04-24T19:00:00Z',
  },
  {
    productId: 'prod-parmezaan',
    status: PantryStatus.out,
    lastUpdatedAt: '2026-04-25T08:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Purchase history — append-only, last few entries per product
// ---------------------------------------------------------------------------

export const purchaseHistory: PurchaseHistoryEntry[] = [
  {
    id: 'ph-001',
    productId: 'prod-melk',
    purchasedAt: '2026-03-28T11:00:00Z',
    source: { shoppingListId: 'sl-prev-3' },
  },
  {
    id: 'ph-002',
    productId: 'prod-melk',
    purchasedAt: '2026-04-04T11:00:00Z',
    source: { shoppingListId: 'sl-prev-2' },
  },
  {
    id: 'ph-003',
    productId: 'prod-melk',
    purchasedAt: '2026-04-11T11:00:00Z',
    source: { shoppingListId: 'sl-prev-1' },
  },
  {
    id: 'ph-004',
    productId: 'prod-olijfolie',
    purchasedAt: '2026-03-01T11:00:00Z',
    source: { shoppingListId: 'sl-prev-3' },
  },
  {
    id: 'ph-005',
    productId: 'prod-ui',
    purchasedAt: '2026-04-11T11:00:00Z',
    source: { shoppingListId: 'sl-prev-1' },
  },
];

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

/** Chili con carne — one full household meal. */
export const recipeChili: Recipe = {
  id: 'recipe-chili',
  name: 'Chili con carne',
  tags: ['avondeten', 'winterkost'],
  ingredients: [
    {
      productId: 'prod-gehakt',
      quantity: 500,
      unit: Unit.gram,
      flags: [IngredientFlag.fresh],
    },
    {
      productId: 'prod-ui',
      quantity: 2,
      unit: Unit.stuk,
      flags: [IngredientFlag.pantry_item],
    },
    {
      productId: 'prod-knoflook',
      quantity: 2,
      unit: Unit.stuk,
      flags: [IngredientFlag.pantry_item],
    },
    {
      productId: 'prod-tomaten-blik',
      quantity: 2,
      unit: Unit.blik,
      flags: [IngredientFlag.pantry_item],
    },
    {
      productId: 'prod-kidneybonen',
      quantity: 1,
      unit: Unit.blik,
      flags: [IngredientFlag.pantry_item],
    },
    {
      productId: 'prod-paprikapoeder',
      quantity: 10,
      unit: Unit.gram,
      flags: [IngredientFlag.pantry_item],
    },
  ],
};

/** Pasta met tomatensaus — one full household meal. */
export const recipePasta: Recipe = {
  id: 'recipe-pasta',
  name: 'Pasta met tomatensaus',
  tags: ['avondeten', 'snel'],
  ingredients: [
    {
      productId: 'prod-pasta',
      quantity: 400,
      unit: Unit.gram,
      flags: [IngredientFlag.pantry_item],
    },
    {
      productId: 'prod-tomaten-blik',
      quantity: 1,
      unit: Unit.blik,
      flags: [IngredientFlag.pantry_item],
    },
    {
      productId: 'prod-ui',
      quantity: 1,
      unit: Unit.stuk,
      flags: [IngredientFlag.pantry_item],
    },
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

// ---------------------------------------------------------------------------
// Meal plan — week starting Saturday 2026-04-26
// ---------------------------------------------------------------------------

export const mealPlanWeek: MealPlan = {
  id: 'mp-2026-w17',
  weekStartDate: '2026-04-26',
  entries: [
    // Saturday dinner: chili
    {
      id: 'mpe-001',
      date: '2026-04-26',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.recipe,
      recipeId: 'recipe-chili',
      quantity: 1,
    },
    // Sunday dinner: freezer portion of previous chili batch
    {
      id: 'mpe-002',
      date: '2026-04-27',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.freezer,
      freezerItemId: 'fi-chili',
      quantity: 1,
    },
    // Monday dinner: pasta
    {
      id: 'mpe-003',
      date: '2026-04-28',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.recipe,
      recipeId: 'recipe-pasta',
      quantity: 1,
    },
    // Tuesday dinner: eating elsewhere
    {
      id: 'mpe-004',
      date: '2026-04-29',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.eating_elsewhere,
      quantity: 1,
    },
    // Wednesday dinner: ordering food
    {
      id: 'mpe-005',
      date: '2026-04-30',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.ordering_food,
      quantity: 1,
    },
    // Thursday dinner: open / undecided
    {
      id: 'mpe-006',
      date: '2026-05-01',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.open,
      quantity: 1,
    },
    // Friday dinner: pasta again (quantity 1)
    {
      id: 'mpe-007',
      date: '2026-05-02',
      moment: MealMoment.dinner,
      type: MealPlanEntryType.recipe,
      recipeId: 'recipe-pasta',
      quantity: 1,
    },
  ],
};

// ---------------------------------------------------------------------------
// Freezer items
// ---------------------------------------------------------------------------

export const freezerItems: FreezerItem[] = [
  {
    id: 'fi-chili',
    name: 'Chili con carne',
    portions: 3,
    createdAt: '2026-04-19T20:00:00Z',
  },
  {
    id: 'fi-kip',
    name: 'Kippendijen (los)',
    portions: 4,
    createdAt: '2026-04-12T15:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Shopping list — generated for the week above
// Items: aggregated, maybe-needed, multiple sources
// ---------------------------------------------------------------------------

export const shoppingList: ShoppingList = {
  id: 'sl-2026-04-26',
  createdAt: '2026-04-26T08:00:00Z',
  items: [
    // Rundergehakt — fresh ingredient, always added (chili)
    {
      id: 'sli-001',
      productId: 'prod-gehakt',
      quantity: 500,
      unit: Unit.gram,
      category: ProductCategory.vlees_vis,
      sources: [{ type: 'recipe', referenceId: 'recipe-chili', note: 'Chili con carne' }],
      status: 'unchecked',
      uncertainty: 'certain',
    },
    // Uien — aggregated from chili (2 stuks) + pasta (1 stuk) = 3 stuks
    // Both pantry_item but voorraad says "mogelijk op"
    {
      id: 'sli-002',
      productId: 'prod-ui',
      quantity: 3,
      unit: Unit.stuk,
      category: ProductCategory.groente_fruit,
      sources: [
        { type: 'recipe', referenceId: 'recipe-chili', note: 'Chili con carne — 2 stuks' },
        { type: 'recipe', referenceId: 'recipe-pasta', note: 'Pasta met tomatensaus — 1 stuk' },
        { type: 'pantry', note: 'Mogelijk op in voorraad' },
      ],
      status: 'unchecked',
      uncertainty: 'certain',
    },
    // Kidneybonen — pantry says "op", so add
    {
      id: 'sli-003',
      productId: 'prod-kidneybonen',
      quantity: 1,
      unit: Unit.blik,
      category: ProductCategory.houdbaar,
      sources: [
        { type: 'recipe', referenceId: 'recipe-chili', note: 'Chili con carne' },
        { type: 'pantry', note: 'Op in voorraad' },
      ],
      status: 'unchecked',
      uncertainty: 'certain',
    },
    // Tomaten (blik) — chili needs 2 + pasta needs 1 = 3 blikken
    // Pantry says "in huis" but recipes still call for it; stays on list
    {
      id: 'sli-004',
      productId: 'prod-tomaten-blik',
      quantity: 3,
      unit: Unit.blik,
      category: ProductCategory.houdbaar,
      sources: [
        { type: 'recipe', referenceId: 'recipe-chili', note: 'Chili con carne — 2 blikken' },
        { type: 'recipe', referenceId: 'recipe-pasta', note: 'Pasta met tomatensaus — 1 blik' },
      ],
      status: 'unchecked',
      uncertainty: 'certain',
    },
    // Parmezaan — fresh + optional (recipe-pasta, x2 dinners = 100 g)
    // Marked as "maybe needed" because the ingredient is optional
    {
      id: 'sli-005',
      productId: 'prod-parmezaan',
      quantity: 100,
      unit: Unit.gram,
      category: ProductCategory.zuivel,
      sources: [
        { type: 'recipe', referenceId: 'recipe-pasta', note: 'Pasta met tomatensaus (optioneel)' },
      ],
      status: 'unchecked',
      uncertainty: 'maybe_needed',
    },
    // Olijfolie — pantry says "mogelijk op" + needed by pasta recipe
    {
      id: 'sli-006',
      productId: 'prod-olijfolie',
      quantity: 1,
      unit: Unit.fles,
      category: ProductCategory.houdbaar,
      sources: [
        { type: 'pantry', note: 'Mogelijk op in voorraad' },
        { type: 'recipe', referenceId: 'recipe-pasta', note: 'Pasta met tomatensaus' },
      ],
      status: 'unchecked',
      uncertainty: 'maybe_needed',
    },
    // Melk — pantry prediction says running out, not linked to any recipe
    {
      id: 'sli-007',
      productId: 'prod-melk',
      quantity: 2,
      unit: Unit.liter,
      category: ProductCategory.zuivel,
      sources: [{ type: 'pantry', note: 'Mogelijk op — voorspeld op basis van koopgeschiedenis' }],
      status: 'unchecked',
      uncertainty: 'maybe_needed',
    },
    // Manual item added by user
    {
      id: 'sli-008',
      productId: 'prod-pasta',
      quantity: 500,
      unit: Unit.gram,
      category: ProductCategory.houdbaar,
      sources: [{ type: 'manual' }],
      status: 'unchecked',
      uncertainty: 'certain',
    },
  ],
};

import type { PantryItem } from '../pantry.js';
import { PantryStatus } from '../pantry.js';
import type { Product } from '../product.js';
import { ProductCategory, Unit } from '../product.js';
import type { RecipeIngredient, Recipe } from '../recipe.js';
import { IngredientFlag } from '../recipe.js';
import type { MealPlan } from '../meal-plan.js';
import { MealPlanEntryType } from '../meal-plan.js';
import type { FreezerItem } from '../freezer.js';
import type {
  ShoppingList,
  ShoppingListItem,
  ShoppingListItemUncertainty,
} from '../shopping-list.js';
import { aggregateShoppingItems } from './aggregate-shopping-items.js';

export interface GenerateShoppingListInput {
  /** Items predicted to be running out — each becomes a maybe_needed entry. */
  pantrySuggestions: PantryItem[];
  /**
   * Full current pantry snapshot used to determine ingredient statuses.
   * Required so recipe ingredients can be skipped when the product is in_house.
   */
  pantryItems: PantryItem[];
  mealPlan: MealPlan;
  recipes: Recipe[];
  /** Freezer entries are tracked elsewhere; no groceries are generated for them. */
  freezerItems: FreezerItem[];
  manualItems: ShoppingListItem[];
  /**
   * Product catalogue for resolving category and default unit.
   * Missing products fall back to category=overige and unit=stuk.
   */
  products: Product[];
  /** ISO date-time string representing "now" — used as `createdAt` on the resulting list. */
  now: string;
}

/**
 * Generate a new shopping list from pantry suggestions, a meal plan and manual additions.
 *
 * Processing order:
 * 1. Pantry suggestions → maybe_needed items (quantity: 1, product's default unit).
 * 2. Meal plan recipe entries → ingredient items (skipped/certain/maybe_needed by flag + status).
 * 3. Manual items → added verbatim.
 *
 * All raw items are finally passed through `aggregateShoppingItems` to merge duplicates.
 */
export function generateShoppingList(input: GenerateShoppingListInput): ShoppingList {
  const { pantrySuggestions, pantryItems, mealPlan, recipes, manualItems, products, now } = input;

  const productsMap = new Map<string, Product>(products.map((p) => [p.id, p]));
  const pantryMap = new Map<string, PantryItem>(pantryItems.map((p) => [p.productId, p]));
  const recipesMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));

  const raw: ShoppingListItem[] = [];

  // 1. Pantry suggestions
  for (const pantryItem of pantrySuggestions) {
    const product = productsMap.get(pantryItem.productId);
    raw.push({
      id: `pantry-${pantryItem.productId}`,
      productId: pantryItem.productId,
      quantity: 1,
      unit: product?.defaultUnit ?? Unit.stuk,
      category: product?.category ?? ProductCategory.overige,
      sources: [{ type: 'pantry' }],
      status: 'unchecked',
      uncertainty: 'maybe_needed',
    });
  }

  // 2. Meal plan recipe entries
  for (const entry of mealPlan.entries) {
    if (entry.type !== MealPlanEntryType.recipe || !entry.recipeId) continue;

    const recipe = recipesMap.get(entry.recipeId);
    if (!recipe) continue;

    for (const ingredient of recipe.ingredients) {
      const uncertainty = resolveIngredientUncertainty(ingredient, pantryMap);
      if (uncertainty === null) continue; // skip (in_house pantry item)

      const product = productsMap.get(ingredient.productId);
      raw.push({
        id: `recipe-${entry.id}-${ingredient.productId}-${ingredient.unit}`,
        productId: ingredient.productId,
        quantity: ingredient.quantity * entry.quantity,
        unit: ingredient.unit,
        category: product?.category ?? ProductCategory.overige,
        sources: [{ type: 'recipe', referenceId: recipe.id }],
        status: 'unchecked',
        uncertainty,
      });
    }
  }

  // 3. Manual items (verbatim)
  for (const item of manualItems) {
    raw.push({ ...item });
  }

  const items = aggregateShoppingItems(raw);

  return {
    id: `sl-${mealPlan.id}`,
    createdAt: now,
    items,
  };
}

/**
 * Determine whether an ingredient should be added to the shopping list and with what certainty.
 *
 * Returns null when the ingredient should be skipped entirely.
 *
 * Flag precedence (highest to lowest):
 * - optional  → always maybe_needed
 * - fresh     → always certain (unless also optional)
 * - pantry_item → depends on current pantry status
 * - (no flags / replaceable) → always certain
 */
function resolveIngredientUncertainty(
  ingredient: RecipeIngredient,
  pantryMap: Map<string, PantryItem>,
): ShoppingListItemUncertainty | null {
  const flags = ingredient.flags ?? [];

  if (flags.includes(IngredientFlag.optional)) {
    return 'maybe_needed';
  }

  if (flags.includes(IngredientFlag.fresh)) {
    return 'certain';
  }

  if (flags.includes(IngredientFlag.pantry_item)) {
    const pantryItem = pantryMap.get(ingredient.productId);
    if (!pantryItem || pantryItem.status === PantryStatus.out) {
      return 'certain';
    }
    if (pantryItem.status === PantryStatus.possibly_running_out) {
      return 'maybe_needed';
    }
    // PantryStatus.in_house → skip
    return null;
  }

  // replaceable or no flags → always add
  return 'certain';
}

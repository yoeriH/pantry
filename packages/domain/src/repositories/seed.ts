/**
 * Seed storage with fixture data on first use.
 *
 * Each collection is only seeded when it is completely absent from storage.
 * Existing data is never overwritten, so the function is safe to call on every
 * application startup.
 */

import type { LocalStorageAdapter } from '../storage/local-storage.js';
import * as fixtures from '../fixtures.js';
import { ProductRepository } from './products.js';
import { PantryItemRepository } from './pantry-items.js';
import { RecipeRepository } from './recipes.js';
import { MealPlanRepository } from './meal-plans.js';
import { FreezerItemRepository } from './freezer-items.js';
import { ShoppingListRepository } from './shopping-lists.js';
import { PurchaseHistoryRepository } from './purchase-history.js';

export function seedStorage(adapter: LocalStorageAdapter): void {
  const products = new ProductRepository(adapter);
  if (products.getAll().length === 0) {
    products.replaceAll(fixtures.products);
  }

  const pantryItems = new PantryItemRepository(adapter);
  if (pantryItems.getAll().length === 0) {
    pantryItems.replaceAll(fixtures.pantryItems);
  }

  const recipes = new RecipeRepository(adapter);
  if (recipes.getAll().length === 0) {
    recipes.replaceAll([fixtures.recipeChili, fixtures.recipePasta]);
  }

  const mealPlans = new MealPlanRepository(adapter);
  if (mealPlans.getAll().length === 0) {
    mealPlans.replaceAll([fixtures.mealPlanWeek]);
  }

  const freezerItems = new FreezerItemRepository(adapter);
  if (freezerItems.getAll().length === 0) {
    freezerItems.replaceAll(fixtures.freezerItems);
  }

  const shoppingLists = new ShoppingListRepository(adapter);
  if (shoppingLists.getAll().length === 0) {
    shoppingLists.replaceAll([fixtures.shoppingList]);
  }

  const purchaseHistory = new PurchaseHistoryRepository(adapter);
  if (purchaseHistory.getAll().length === 0) {
    purchaseHistory.replaceAll(fixtures.purchaseHistory);
  }
}

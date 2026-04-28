/**
 * PantryAppService — application use-case facade.
 *
 * Coordinates repositories and pure domain-engine functions.
 * UI code calls only this service; it never touches repositories or localStorage directly.
 *
 * Design rules:
 * - Receives all repository instances via the constructor (dependency injection).
 * - Delegates all business logic to the domain engine (pure functions in engine/).
 * - Never calls localStorage or any StorageBackend directly.
 * - Methods that need a current timestamp accept `now: string` (ISO date-time)
 *   so callers and tests remain in full control of time.
 * - `createId` is injectable for deterministic test setups.
 */

import type { Product } from '../product.js';
import type { PantryItem } from '../pantry.js';
import { PantryStatus } from '../pantry.js';
import type { PredictionAdjustment } from '../pantry.js';
import type { Recipe } from '../recipe.js';
import type { MealPlan, MealPlanEntry } from '../meal-plan.js';
import type { FreezerItem } from '../freezer.js';
import type { ShoppingList, ShoppingListItem } from '../shopping-list.js';
import type { PurchaseHistoryEntry } from '../purchase-history.js';
import type { ProductRepository } from '../repositories/products.js';
import type { PantryItemRepository } from '../repositories/pantry-items.js';
import type { RecipeRepository } from '../repositories/recipes.js';
import type { MealPlanRepository } from '../repositories/meal-plans.js';
import type { FreezerItemRepository } from '../repositories/freezer-items.js';
import type { ShoppingListRepository } from '../repositories/shopping-lists.js';
import type { PurchaseHistoryRepository } from '../repositories/purchase-history.js';
import {
  applyPredictionAdjustment,
  generatePantrySuggestions,
  generateShoppingList,
  resolveShoppingItem,
  completeShopping,
  consumeFreezerItem as consumeFreezerItemEngine,
} from '../engine/index.js';
import { addDays } from '../engine/date-utils.js';
import { createId as defaultCreateId } from './id-utils.js';

// ---------------------------------------------------------------------------
// Dependency injection types
// ---------------------------------------------------------------------------

export interface PantryAppServiceDeps {
  products: ProductRepository;
  pantryItems: PantryItemRepository;
  recipes: RecipeRepository;
  mealPlans: MealPlanRepository;
  freezerItems: FreezerItemRepository;
  shoppingLists: ShoppingListRepository;
  purchaseHistory: PurchaseHistoryRepository;
  /** Override for testing to generate deterministic IDs. Defaults to timestamp-based ID generation in production. */
  createId?: (prefix: string) => string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of days in one week — used when shifting meal plan entries. */
const DAYS_IN_WEEK = 7;

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface CopyPreviousWeekResult {
  /** True when a previous-week plan was found and copied. */
  copied: true;
  mealPlan: MealPlan;
}

export interface CopyPreviousWeekNotFoundResult {
  copied: false;
  reason: 'previous_week_not_found';
}

export type CopyPreviousWeekOutcome = CopyPreviousWeekResult | CopyPreviousWeekNotFoundResult;

export interface CompleteShoppingTripResult {
  /** The archived shopping list (has completedAt). */
  completedList: ShoppingList;
  /**
   * Remaining active list containing only unchecked items.
   * Has a new id so it does not collide with the archived list.
   * Items array is empty when all items were checked.
   */
  remainingList: ShoppingList;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class PantryAppService {
  private readonly repos: Required<PantryAppServiceDeps>;

  constructor(deps: PantryAppServiceDeps) {
    this.repos = {
      ...deps,
      createId: deps.createId ?? defaultCreateId,
    };
  }

  // --------------------------------------------------------------------------
  // Products
  // --------------------------------------------------------------------------

  getProducts(): Product[] {
    return this.repos.products.getAll();
  }

  addProduct(input: Omit<Product, 'id'>): Product {
    const product: Product = { ...input, id: this.repos.createId('prod') };
    this.repos.products.save(product);
    return product;
  }

  updateProduct(product: Product): void {
    this.repos.products.save(product);
  }

  deleteProduct(productId: string): void {
    this.repos.products.delete(productId);
  }

  // --------------------------------------------------------------------------
  // Pantry
  // --------------------------------------------------------------------------

  getPantryItems(): PantryItem[] {
    return this.repos.pantryItems.getAll();
  }

  /**
   * Set the explicit status of a pantry item.
   * Creates a new item when no item exists for `productId`.
   */
  setPantryStatus(productId: string, status: PantryStatus, now: string): PantryItem {
    const existing = this.repos.pantryItems.getById(productId);
    const updated: PantryItem = existing
      ? { ...existing, status, lastUpdatedAt: now }
      : { productId, status, lastUpdatedAt: now };
    this.repos.pantryItems.save(updated);
    return updated;
  }

  /**
   * Apply a one-shot ±25 % speed adjustment to the purchase prediction of an item.
   * No-op when the item or its prediction is not found.
   */
  applyPredictionAdjustment(productId: string, adjustment: PredictionAdjustment): void {
    const item = this.repos.pantryItems.getById(productId);
    if (!item?.prediction) return;
    const newPrediction = applyPredictionAdjustment(item.prediction, adjustment);
    this.repos.pantryItems.save({ ...item, prediction: newPrediction });
  }

  /**
   * Remove all purchase history entries for a single product.
   * Leaves entries for other products untouched.
   */
  resetPurchaseHistory(productId: string): void {
    const remaining = this.repos.purchaseHistory
      .getAll()
      .filter((entry) => entry.productId !== productId);
    this.repos.purchaseHistory.replaceAll(remaining);
  }

  /**
   * Return pantry items whose effective status is `possibly_running_out` at `now`.
   */
  getPantrySuggestions(now: string): PantryItem[] {
    return generatePantrySuggestions(this.repos.pantryItems.getAll(), now);
  }

  // --------------------------------------------------------------------------
  // Recipes
  // --------------------------------------------------------------------------

  getRecipes(): Recipe[] {
    return this.repos.recipes.getAll();
  }

  addRecipe(input: Omit<Recipe, 'id'>): Recipe {
    const recipe: Recipe = { ...input, id: this.repos.createId('recipe') };
    this.repos.recipes.save(recipe);
    return recipe;
  }

  updateRecipe(recipe: Recipe): void {
    this.repos.recipes.save(recipe);
  }

  /**
   * Duplicate an existing recipe with a new id and "(kopie)" appended to the name.
   * Throws when the source recipe is not found.
   */
  duplicateRecipe(recipeId: string): Recipe {
    const original = this.repos.recipes.getById(recipeId);
    if (!original) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }
    const copy: Recipe = {
      ...original,
      id: this.repos.createId('recipe'),
      name: `${original.name} (kopie)`,
    };
    this.repos.recipes.save(copy);
    return copy;
  }

  deleteRecipe(recipeId: string): void {
    this.repos.recipes.delete(recipeId);
  }

  // --------------------------------------------------------------------------
  // Meal plan
  // --------------------------------------------------------------------------

  /** Returns the meal plan for the given week-start date, or undefined. */
  getMealPlan(weekStartDate: string): MealPlan | undefined {
    return this.repos.mealPlans.getAll().find((mp) => mp.weekStartDate === weekStartDate);
  }

  saveMealPlan(mealPlan: MealPlan): void {
    this.repos.mealPlans.save(mealPlan);
  }

  /**
   * Copy all entries from the previous week's plan into a new plan for
   * `targetWeekStartDate`, shifting each entry's date forward by 7 days and
   * assigning new ids.
   *
   * Returns `{ copied: true, mealPlan }` on success, or
   * `{ copied: false, reason: 'previous_week_not_found' }` when no plan exists
   * for the previous week.
   */
  copyPreviousWeek(targetWeekStartDate: string): CopyPreviousWeekOutcome {
    const previousWeekStartDate = addDays(targetWeekStartDate, -DAYS_IN_WEEK);
    const previousPlan = this.getMealPlan(previousWeekStartDate);
    if (!previousPlan) {
      return { copied: false, reason: 'previous_week_not_found' };
    }

    const newEntries: MealPlanEntry[] = previousPlan.entries.map((entry) => ({
      ...entry,
      id: this.repos.createId('mpe'),
      date: addDays(entry.date, DAYS_IN_WEEK),
    }));

    const newPlan: MealPlan = {
      id: this.repos.createId('mp'),
      weekStartDate: targetWeekStartDate,
      entries: newEntries,
    };

    this.repos.mealPlans.save(newPlan);
    return { copied: true, mealPlan: newPlan };
  }

  /**
   * Upsert a single entry in the meal plan for `weekStartDate`.
   *
   * - When `entry.id` is set and matches an existing entry, the entry is replaced.
   * - When `entry.id` is absent, a new entry with a generated id is appended.
   * - When no plan exists for the week, a new plan is created.
   */
  setMealPlanEntry(
    weekStartDate: string,
    entry: Omit<MealPlanEntry, 'id'> & { id?: string },
  ): MealPlan {
    const existing = this.getMealPlan(weekStartDate);
    const plan: MealPlan = existing ?? {
      id: this.repos.createId('mp'),
      weekStartDate,
      entries: [],
    };

    const entryId = entry.id ?? this.repos.createId('mpe');
    const fullEntry = { ...entry, id: entryId } as MealPlanEntry;

    const idx = plan.entries.findIndex((e) => e.id === entryId);
    const newEntries =
      idx >= 0
        ? plan.entries.map((e, i) => (i === idx ? fullEntry : e))
        : [...plan.entries, fullEntry];

    const updated: MealPlan = { ...plan, entries: newEntries };
    this.repos.mealPlans.save(updated);
    return updated;
  }

  /**
   * Remove a single entry from the meal plan for `weekStartDate`.
   * Returns the updated plan, or undefined when no plan exists.
   */
  clearMealPlanEntry(weekStartDate: string, entryId: string): MealPlan | undefined {
    const plan = this.getMealPlan(weekStartDate);
    if (!plan) return undefined;

    const updated: MealPlan = {
      ...plan,
      entries: plan.entries.filter((e) => e.id !== entryId),
    };
    this.repos.mealPlans.save(updated);
    return updated;
  }

  // --------------------------------------------------------------------------
  // Freezer
  // --------------------------------------------------------------------------

  getFreezerItems(): FreezerItem[] {
    return this.repos.freezerItems.getAll();
  }

  addFreezerItem(input: Omit<FreezerItem, 'id'>): FreezerItem {
    const item = { ...input, id: this.repos.createId('fi') } as FreezerItem;
    this.repos.freezerItems.save(item);
    return item;
  }

  updateFreezerItem(item: FreezerItem): void {
    this.repos.freezerItems.save(item);
  }

  /**
   * Decrease the portion count of a freezer item.
   * Removes the item automatically when its portions reach zero.
   * No-op when `freezerItemId` is not found.
   */
  consumeFreezerItem(freezerItemId: string, quantity: number): void {
    const updated = consumeFreezerItemEngine(
      this.repos.freezerItems.getAll(),
      freezerItemId,
      quantity,
    );
    this.repos.freezerItems.replaceAll(updated);
  }

  deleteFreezerItem(freezerItemId: string): void {
    this.repos.freezerItems.delete(freezerItemId);
  }

  // --------------------------------------------------------------------------
  // Shopping list
  // --------------------------------------------------------------------------

  /**
   * Returns the single active (not yet completed) shopping list, or undefined.
   */
  getActiveShoppingList(): ShoppingList | undefined {
    return this.repos.shoppingLists.getAll().find((sl) => !sl.completedAt);
  }

  /**
   * Generate a new shopping list from the meal plan for `weekStartDate` and the
   * current pantry state.
   *
   * Processing order (same as engine):
   * 1. Pantry suggestions → maybe_needed items.
   * 2. Meal plan recipe entries → ingredient items.
   * 3. Manual items carried over from any existing active list.
   *
   * Any previously active list is deleted before the new list is saved.
   */
  generateShoppingListFromCurrentPlan(weekStartDate: string, now: string): ShoppingList {
    const mealPlan = this.getMealPlan(weekStartDate) ?? {
      id: this.repos.createId('mp'),
      weekStartDate,
      entries: [],
    };

    const pantryItems = this.repos.pantryItems.getAll();
    const pantrySuggestions = generatePantrySuggestions(pantryItems, now);
    const recipes = this.repos.recipes.getAll();
    const freezerItems = this.repos.freezerItems.getAll();
    const products = this.repos.products.getAll();

    // Carry over manual items from any existing active list.
    const allActiveLists = this.repos.shoppingLists.getAll().filter((sl) => !sl.completedAt);
    const existingActive = allActiveLists[0];
    const manualItems: ShoppingListItem[] = existingActive
      ? existingActive.items.filter((item) => item.sources.every((s) => s.type === 'manual'))
      : [];

    const generated = generateShoppingList({
      pantrySuggestions,
      pantryItems,
      mealPlan,
      recipes,
      freezerItems,
      manualItems,
      products,
      now,
    });

    // Assign a fresh id so repeated generation never overwrites archived lists.
    const newList: ShoppingList = { ...generated, id: this.repos.createId('sl') };

    // Delete ALL active lists to enforce the single-list invariant before saving the new one.
    for (const active of allActiveLists) {
      this.repos.shoppingLists.delete(active.id);
    }
    this.repos.shoppingLists.save(newList);
    return newList;
  }

  /**
   * Append a manually added item to the active shopping list.
   * Throws when no active list exists.
   */
  addManualShoppingItem(item: Omit<ShoppingListItem, 'id'>): ShoppingList {
    const active = this.requireActiveList();
    const newItem: ShoppingListItem = { ...item, id: this.repos.createId('sli') };
    const updated: ShoppingList = { ...active, items: [...active.items, newItem] };
    this.repos.shoppingLists.save(updated);
    return updated;
  }

  /**
   * Replace a shopping list item in the active list.
   * Throws when no active list exists. No-op when `item.id` is not found in the list.
   */
  updateShoppingItem(item: ShoppingListItem): ShoppingList {
    const active = this.requireActiveList();
    const updated: ShoppingList = {
      ...active,
      items: active.items.map((i) => (i.id === item.id ? item : i)),
    };
    this.repos.shoppingLists.save(updated);
    return updated;
  }

  /**
   * Resolve a maybe_needed item in the active list.
   *
   * - `add`  → item uncertainty becomes `certain`.
   * - `skip` → item is removed from the list.
   *
   * Throws when no active list exists or `itemId` is not found.
   */
  resolveMaybeNeededItem(itemId: string, decision: 'add' | 'skip'): ShoppingList {
    const active = this.requireActiveList();
    const item = active.items.find((i) => i.id === itemId);
    if (!item) {
      throw new Error(`Shopping list item not found: ${itemId}`);
    }
    const resolved = resolveShoppingItem(item, decision);
    const newItems = resolved
      ? active.items.map((i) => (i.id === itemId ? resolved : i))
      : active.items.filter((i) => i.id !== itemId);

    const updated: ShoppingList = { ...active, items: newItems };
    this.repos.shoppingLists.save(updated);
    return updated;
  }

  /** Mark a shopping list item as checked. Throws when no active list exists. */
  checkShoppingItem(itemId: string): ShoppingList {
    return this.setShoppingItemStatus(itemId, 'checked');
  }

  /** Mark a shopping list item as unchecked. Throws when no active list exists. */
  uncheckShoppingItem(itemId: string): ShoppingList {
    return this.setShoppingItemStatus(itemId, 'unchecked');
  }

  /**
   * Complete the current shopping trip.
   *
   * Effects (all persisted atomically via repository calls):
   * - Checked items → PantryItem updated/created with status `in_house`.
   * - New PurchaseHistoryEntry appended for each checked item.
   * - Active list archived with `completedAt = now`.
   * - Unchecked items moved to a new active list (with a fresh id).
   *
   * Throws when no active list exists.
   */
  completeShoppingTrip(now: string): CompleteShoppingTripResult {
    const active = this.requireActiveList();
    const pantryItems = this.repos.pantryItems.getAll();
    const history = this.repos.purchaseHistory.getAll();

    const result = completeShopping({
      list: active,
      pantryItems,
      purchaseHistory: history,
      now,
    });

    this.repos.pantryItems.replaceAll(result.updatedPantry);
    this.repos.purchaseHistory.replaceAll(result.purchaseHistory);

    // Archive the completed list (same id as active — the save is an upsert).
    this.repos.shoppingLists.save(result.completedList);

    // Persist unchecked items as a new active list with a different id.
    const remainingList: ShoppingList = {
      ...result.remainingList,
      id: this.repos.createId('sl'),
    };
    if (remainingList.items.length > 0) {
      this.repos.shoppingLists.save(remainingList);
    }

    return { completedList: result.completedList, remainingList };
  }

  // --------------------------------------------------------------------------
  // History
  // --------------------------------------------------------------------------

  /** Returns all completed (archived) shopping lists, oldest first. */
  getShoppingHistory(): ShoppingList[] {
    return this.repos.shoppingLists.getAll().filter((sl) => Boolean(sl.completedAt));
  }

  getPurchaseHistory(): PurchaseHistoryEntry[] {
    return this.repos.purchaseHistory.getAll();
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private requireActiveList(): ShoppingList {
    const active = this.getActiveShoppingList();
    if (!active) {
      throw new Error('No active shopping list found');
    }
    return active;
  }

  private setShoppingItemStatus(itemId: string, status: 'checked' | 'unchecked'): ShoppingList {
    const active = this.requireActiveList();
    const updated: ShoppingList = {
      ...active,
      items: active.items.map((i) => (i.id === itemId ? { ...i, status } : i)),
    };
    this.repos.shoppingLists.save(updated);
    return updated;
  }
}

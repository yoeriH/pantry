/**
 * Meal plan — week menu running Saturday through Friday.
 * Each day has multiple meal moments, each slot has a single entry.
 */

/** Meal moments within a day. */
export enum MealMoment {
  breakfast = 'breakfast',
  lunch = 'lunch',
  dinner = 'dinner',
  snack = 'snack',
}

/**
 * Determines what happens when this slot is resolved (see PRODUCT_SPEC §5.5 and §8):
 * - recipe        → pulls recipe ingredients into the shopping list.
 * - open          → undecided; no groceries generated, user is reminded.
 * - eating_elsewhere → no groceries generated.
 * - ordering_food → no groceries generated.
 * - freezer       → consumes a freezer portion; no recipe groceries generated.
 */
export enum MealPlanEntryType {
  recipe = 'recipe',
  open = 'open',
  eating_elsewhere = 'eating_elsewhere',
  ordering_food = 'ordering_food',
  freezer = 'freezer',
}

export interface MealPlanEntry {
  id: string;
  /** ISO date string (YYYY-MM-DD) for the day this entry belongs to. */
  date: string;
  moment: MealMoment;
  type: MealPlanEntryType;
  /** Present only when type is 'recipe'. */
  recipeId?: string;
  /** Present only when type is 'freezer'. */
  freezerItemId?: string;
  /**
   * How many times this recipe/freezer item is consumed for this slot.
   * Defaults to 1 (one full household meal).
   */
  quantity: number;
}

export interface MealPlan {
  id: string;
  /** ISO date string (YYYY-MM-DD) for the Saturday that starts this week. */
  weekStartDate: string;
  entries: MealPlanEntry[];
}

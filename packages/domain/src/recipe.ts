/**
 * Recipe — a named set of structured ingredients expressed in family portions.
 * One recipe quantity = one full household meal.
 */

import type { Unit } from './product.js';

/** Behaviour flags for an ingredient within a recipe (see PRODUCT_SPEC §6.2). */
export enum IngredientFlag {
  /** Normal pantry item — only add to shopping list if voorraad status is "op" or "mogelijk op". */
  pantry_item = 'pantry_item',
  /** Usually buy fresh — always add to shopping list. */
  fresh = 'fresh',
  /** Optional — not auto-added to shopping list. */
  optional = 'optional',
  /** Replaceable — added but flagged as replaceable. */
  replaceable = 'replaceable',
}

export interface RecipeIngredient {
  productId: string;
  quantity: number;
  unit: Unit;
  /** Behavioural flags that control how this ingredient appears on the shopping list. */
  flags?: IngredientFlag[];
}

export interface Recipe {
  id: string;
  name: string;
  tags?: string[];
  ingredients: RecipeIngredient[];
}

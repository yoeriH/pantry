/**
 * Domain engine — pure, deterministic functions for pantry and shopping logic.
 * No side effects. No I/O. No framework dependencies.
 */

export { predictPurchase } from './predict-purchase.js';
export { applyPredictionAdjustment } from './apply-prediction-adjustment.js';
export { determinePantryStatus } from './determine-pantry-status.js';
export { generatePantrySuggestions } from './generate-pantry-suggestions.js';
export { aggregateShoppingItems } from './aggregate-shopping-items.js';
export type { GenerateShoppingListInput } from './generate-shopping-list.js';
export { generateShoppingList } from './generate-shopping-list.js';
export { resolveShoppingItem } from './resolve-shopping-item.js';
export type { CompleteShoppingInput, CompleteShoppingResult } from './complete-shopping.js';
export { completeShopping } from './complete-shopping.js';
export { consumeFreezerItem } from './consume-freezer-item.js';

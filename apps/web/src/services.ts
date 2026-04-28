/**
 * Service singleton — wires PantryAppService to the browser localStorage backend.
 *
 * Import `service` from this module in any Web Component that needs to read or
 * mutate application state.  Never instantiate PantryAppService directly in a
 * component; never call localStorage directly.
 */

import { storage, repositories, app } from '@pantry/domain';

const backend = new storage.LocalStorageBackend();
const adapter = new storage.LocalStorageAdapter(backend);

export const service = new app.PantryAppService({
  products: new repositories.ProductRepository(adapter),
  pantryItems: new repositories.PantryItemRepository(adapter),
  recipes: new repositories.RecipeRepository(adapter),
  mealPlans: new repositories.MealPlanRepository(adapter),
  freezerItems: new repositories.FreezerItemRepository(adapter),
  shoppingLists: new repositories.ShoppingListRepository(adapter),
  purchaseHistory: new repositories.PurchaseHistoryRepository(adapter),
});

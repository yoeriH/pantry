import type { LocalStorageAdapter } from '../storage/local-storage.js';
import type { Recipe } from '../recipe.js';
import { BaseRepository } from './base-repository.js';

export class RecipeRepository extends BaseRepository<Recipe> {
  constructor(adapter: LocalStorageAdapter) {
    super(adapter, 'recipes', (r) => r.id);
  }
}

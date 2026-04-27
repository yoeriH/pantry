import type { LocalStorageAdapter } from '../storage/local-storage.js';
import type { MealPlan } from '../meal-plan.js';
import { BaseRepository } from './base-repository.js';

export class MealPlanRepository extends BaseRepository<MealPlan> {
  constructor(adapter: LocalStorageAdapter) {
    super(adapter, 'meal-plans', (mp) => mp.id);
  }
}

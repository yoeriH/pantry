import type { LocalStorageAdapter } from '../storage/local-storage.js';
import type { PantryItem } from '../pantry.js';
import { BaseRepository } from './base-repository.js';

/**
 * PantryItemRepository — keyed by productId (PantryItem has no separate id field).
 * getById(id) accepts a productId.
 */
export class PantryItemRepository extends BaseRepository<PantryItem> {
  constructor(adapter: LocalStorageAdapter) {
    super(adapter, 'pantry-items', (item) => item.productId);
  }
}

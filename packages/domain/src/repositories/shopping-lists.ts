import type { LocalStorageAdapter } from '../storage/local-storage.js';
import type { ShoppingList } from '../shopping-list.js';
import { BaseRepository } from './base-repository.js';

export class ShoppingListRepository extends BaseRepository<ShoppingList> {
  constructor(adapter: LocalStorageAdapter) {
    super(adapter, 'shopping-lists', (sl) => sl.id);
  }
}

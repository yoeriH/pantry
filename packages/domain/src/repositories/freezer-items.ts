import type { LocalStorageAdapter } from '../storage/local-storage.js';
import type { FreezerItem } from '../freezer.js';
import { BaseRepository } from './base-repository.js';

export class FreezerItemRepository extends BaseRepository<FreezerItem> {
  constructor(adapter: LocalStorageAdapter) {
    super(adapter, 'freezer-items', (fi) => fi.id);
  }
}

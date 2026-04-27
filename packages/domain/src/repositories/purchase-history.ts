import type { LocalStorageAdapter } from '../storage/local-storage.js';
import type { PurchaseHistoryEntry } from '../purchase-history.js';
import { BaseRepository } from './base-repository.js';

export class PurchaseHistoryRepository extends BaseRepository<PurchaseHistoryEntry> {
  constructor(adapter: LocalStorageAdapter) {
    super(adapter, 'purchase-history', (entry) => entry.id);
  }
}

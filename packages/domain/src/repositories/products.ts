import type { LocalStorageAdapter } from '../storage/local-storage.js';
import type { Product } from '../product.js';
import { BaseRepository } from './base-repository.js';

export class ProductRepository extends BaseRepository<Product> {
  constructor(adapter: LocalStorageAdapter) {
    super(adapter, 'products', (p) => p.id);
  }
}

/**
 * BaseRepository — generic CRUD repository backed by a LocalStorageAdapter.
 *
 * All entities are stored as a single JSON array per key.  This is intentional:
 * the household datasets are small (tens to hundreds of items), so array scans
 * are fine and the implementation stays simple.
 *
 * Input entities are deep-cloned on write so callers cannot mutate stored data
 * by accident.  Returned arrays are also cloned so stored data cannot be mutated
 * through the returned references.
 */

import type { LocalStorageAdapter } from '../storage/local-storage.js';

export class BaseRepository<T> {
  constructor(
    private readonly adapter: LocalStorageAdapter,
    private readonly storageKey: string,
    private readonly extractId: (entity: T) => string,
  ) {}

  /** Returns a shallow-copy array of all stored entities. */
  getAll(): T[] {
    const stored = this.adapter.get<T[]>(this.storageKey);
    return stored ? structuredClone(stored) : [];
  }

  /** Returns the entity matching id, or undefined when not found. */
  getById(id: string): T | undefined {
    return this.getAll().find((item) => this.extractId(item) === id);
  }

  /**
   * Upsert: replaces the existing entity with the same id, or appends it when
   * no match is found.  The input entity is cloned before storing.
   */
  save(entity: T): void {
    const all = this.getAll();
    const index = all.findIndex((item) => this.extractId(item) === this.extractId(entity));
    if (index >= 0) {
      all[index] = structuredClone(entity);
    } else {
      all.push(structuredClone(entity));
    }
    this.adapter.set(this.storageKey, all);
  }

  /** Removes the entity with the given id (no-op when not found). */
  delete(id: string): void {
    const filtered = this.getAll().filter((item) => this.extractId(item) !== id);
    this.adapter.set(this.storageKey, filtered);
  }

  /**
   * Replaces the entire collection with the provided list.
   * Each item is cloned before storing.
   */
  replaceAll(items: T[]): void {
    this.adapter.set(this.storageKey, structuredClone(items));
  }
}

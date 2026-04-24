/**
 * StoragePort — generic persistence interface.
 *
 * This is the boundary between the application and its persistence layer.
 * Currently backed by BrowserStorageAdapter (localStorage).
 * Future migration: swap the adapter for a backend/NeonDB-backed implementation
 * without changing any call sites that depend on this interface.
 */
export interface StoragePort {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clearNamespace(namespace: string): void;
}

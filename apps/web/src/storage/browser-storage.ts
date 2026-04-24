import type { StoragePort } from './storage-port.js';

/**
 * BrowserStorageAdapter — localStorage-backed implementation of StoragePort.
 *
 * This is the temporary local persistence boundary.
 * All keys are namespaced to avoid collisions with other localStorage users.
 *
 * Migration path: replace this adapter with a backend-API adapter that calls
 * the server, which will in turn persist to NeonDB/Postgres.
 */
export class BrowserStorageAdapter implements StoragePort {
  constructor(private readonly namespace: string = 'pantry') {}

  private key(key: string): string {
    return `${this.namespace}:${key}`;
  }

  get<T>(key: string): T | null {
    const raw = localStorage.getItem(this.key(key));
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(this.key(key), JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(this.key(key));
  }

  clearNamespace(namespace: string): void {
    const prefix = `${namespace}:`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  }
}

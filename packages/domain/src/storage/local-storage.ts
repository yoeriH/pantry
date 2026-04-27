/**
 * LocalStorage persistence adapter.
 *
 * - Prefixes all keys with "pantry:" to avoid collisions.
 * - Wraps every stored value in a versioned envelope so schema migrations can
 *   be applied on read without touching the raw data.
 * - Never throws on corrupted or unknown data — returns null and resets the key.
 * - The StorageBackend interface is injected, keeping this module testable in
 *   Node (where window.localStorage is absent) via InMemoryStorageBackend.
 */

export const STORAGE_VERSION = 1;
export const STORAGE_PREFIX = 'pantry:';

// ---------------------------------------------------------------------------
// Storage backend abstraction
// ---------------------------------------------------------------------------

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Thin wrapper around the real browser localStorage. */
export class LocalStorageBackend implements StorageBackend {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}

/** In-memory backend used in unit tests (no DOM required). */
export class InMemoryStorageBackend implements StorageBackend {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  /** Wipe all stored entries — handy for test teardown. */
  clear(): void {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// Versioned envelope
// ---------------------------------------------------------------------------

interface VersionedData<T> {
  version: number;
  data: T;
}

function isVersionedData(value: unknown): value is VersionedData<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    'data' in value &&
    typeof (value as Record<string, unknown>)['version'] === 'number'
  );
}

/**
 * Migration function.  Add cases here as STORAGE_VERSION is incremented.
 * Returns migrated data for the current version, or null to trigger a reset.
 */
function migrate<T>(versioned: VersionedData<unknown>): T | null {
  // Only version 1 exists today; all other versions are treated as unknown.
  void versioned;
  return null;
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class LocalStorageAdapter {
  constructor(private readonly backend: StorageBackend) {}

  private prefixed(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  /** Returns stored data or null on miss, corruption, or version mismatch. */
  get<T>(key: string): T | null {
    const raw = this.backend.getItem(this.prefixed(key));
    if (raw === null) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Corrupted JSON — wipe and return null.
      this.backend.removeItem(this.prefixed(key));
      return null;
    }

    if (!isVersionedData(parsed)) {
      // Missing envelope — treat as unknown format and reset.
      this.backend.removeItem(this.prefixed(key));
      return null;
    }

    if (parsed.version !== STORAGE_VERSION) {
      const migrated = migrate<T>(parsed);
      if (migrated === null) {
        // No migration path available — reset safely.
        this.backend.removeItem(this.prefixed(key));
        return null;
      }
      // Persist the migrated data so next read is fast.
      this.set(key, migrated);
      return migrated;
    }

    return parsed.data as T;
  }

  /** Serialize and persist data under the versioned envelope. */
  set<T>(key: string, data: T): void {
    const envelope: VersionedData<T> = { version: STORAGE_VERSION, data };
    this.backend.setItem(this.prefixed(key), JSON.stringify(envelope));
  }

  /** Remove the entry for key. */
  remove(key: string): void {
    this.backend.removeItem(this.prefixed(key));
  }
}

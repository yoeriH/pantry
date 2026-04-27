import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalStorageAdapter,
  InMemoryStorageBackend,
  STORAGE_PREFIX,
  STORAGE_VERSION,
} from './local-storage.js';

function makeAdapter(): { adapter: LocalStorageAdapter; backend: InMemoryStorageBackend } {
  const backend = new InMemoryStorageBackend();
  const adapter = new LocalStorageAdapter(backend);
  return { adapter, backend };
}

describe('LocalStorageAdapter', () => {
  describe('get / set roundtrip', () => {
    it('returns null for a key that was never set', () => {
      const { adapter } = makeAdapter();
      expect(adapter.get('unknown')).toBeNull();
    });

    it('returns the stored value after set', () => {
      const { adapter } = makeAdapter();
      adapter.set('items', [1, 2, 3]);
      expect(adapter.get('items')).toEqual([1, 2, 3]);
    });

    it('returns null after remove', () => {
      const { adapter } = makeAdapter();
      adapter.set('x', 'hello');
      adapter.remove('x');
      expect(adapter.get('x')).toBeNull();
    });

    it('prefixes the underlying storage key', () => {
      const { adapter, backend } = makeAdapter();
      adapter.set('products', ['a']);
      expect(backend.getItem(`${STORAGE_PREFIX}products`)).not.toBeNull();
      expect(backend.getItem('products')).toBeNull();
    });

    it('does not mutate the stored value on subsequent reads', () => {
      const { adapter } = makeAdapter();
      const original = { id: '1', name: 'Ui' };
      adapter.set('thing', original);
      const first = adapter.get<typeof original>('thing')!;
      first.name = 'changed';
      const second = adapter.get<typeof original>('thing')!;
      expect(second.name).toBe('Ui');
    });
  });

  describe('corrupted storage recovery', () => {
    it('returns null when the raw value is not valid JSON', () => {
      const { adapter, backend } = makeAdapter();
      backend.setItem(`${STORAGE_PREFIX}broken`, 'not-json{{{');
      expect(adapter.get('broken')).toBeNull();
    });

    it('removes the corrupted key so a subsequent set works', () => {
      const { adapter, backend } = makeAdapter();
      backend.setItem(`${STORAGE_PREFIX}broken`, '!!bad');
      adapter.get('broken'); // triggers recovery
      adapter.set('broken', [42]);
      expect(adapter.get('broken')).toEqual([42]);
    });

    it('returns null when the stored object lacks the version envelope', () => {
      const { adapter, backend } = makeAdapter();
      backend.setItem(`${STORAGE_PREFIX}bare`, JSON.stringify({ foo: 'bar' }));
      expect(adapter.get('bare')).toBeNull();
    });
  });

  describe('version mismatch handling', () => {
    it('returns null and removes the key when the stored version is unknown', () => {
      const { adapter, backend } = makeAdapter();
      const future = { version: STORAGE_VERSION + 99, data: ['stale'] };
      backend.setItem(`${STORAGE_PREFIX}v-future`, JSON.stringify(future));
      expect(adapter.get('v-future')).toBeNull();
      expect(backend.getItem(`${STORAGE_PREFIX}v-future`)).toBeNull();
    });

    it('accepts data stored with the current version', () => {
      const { adapter, backend } = makeAdapter();
      const current = { version: STORAGE_VERSION, data: ['ok'] };
      backend.setItem(`${STORAGE_PREFIX}v-ok`, JSON.stringify(current));
      expect(adapter.get('v-ok')).toEqual(['ok']);
    });
  });
});

describe('InMemoryStorageBackend', () => {
  let backend: InMemoryStorageBackend;

  beforeEach(() => {
    backend = new InMemoryStorageBackend();
  });

  it('returns null for unknown keys', () => {
    expect(backend.getItem('x')).toBeNull();
  });

  it('stores and retrieves a value', () => {
    backend.setItem('a', 'hello');
    expect(backend.getItem('a')).toBe('hello');
  });

  it('removes a value', () => {
    backend.setItem('b', 'world');
    backend.removeItem('b');
    expect(backend.getItem('b')).toBeNull();
  });

  it('clear wipes all entries', () => {
    backend.setItem('c', '1');
    backend.setItem('d', '2');
    backend.clear();
    expect(backend.getItem('c')).toBeNull();
    expect(backend.getItem('d')).toBeNull();
  });
});

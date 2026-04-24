import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserStorageAdapter } from './browser-storage.js';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('BrowserStorageAdapter', () => {
  let adapter: BrowserStorageAdapter;

  beforeEach(() => {
    localStorageMock.clear();
    adapter = new BrowserStorageAdapter('test');
  });

  it('round-trips a string value', () => {
    adapter.set('name', 'Alice');
    expect(adapter.get<string>('name')).toBe('Alice');
  });

  it('round-trips an object value', () => {
    const obj = { x: 1, y: 'hello' };
    adapter.set('obj', obj);
    expect(adapter.get('obj')).toEqual(obj);
  });

  it('returns null for a missing key', () => {
    expect(adapter.get('missing')).toBeNull();
  });

  it('removes a key', () => {
    adapter.set('foo', 'bar');
    adapter.remove('foo');
    expect(adapter.get('foo')).toBeNull();
  });

  it('clears keys by namespace', () => {
    adapter.set('a', 1);
    adapter.set('b', 2);
    adapter.clearNamespace('test');
    expect(adapter.get('a')).toBeNull();
    expect(adapter.get('b')).toBeNull();
  });
});

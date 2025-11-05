/// <reference types="vitest" />

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadArrayFromStorage, saveArrayToStorage } from '@/utils/storage';

const STORAGE_KEY = 'test-storage';

class MockStorage implements Storage {
  private backing = new Map<string, string>();

  get length(): number {
    return this.backing.size;
  }

  clear(): void {
    this.backing.clear();
  }

  getItem(key: string): string | null {
    return this.backing.has(key) ? this.backing.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.backing.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.backing.delete(key);
  }

  setItem(key: string, value: string): void {
    this.backing.set(key, value);
  }
}

const isNumber = (value: unknown): value is number => typeof value === 'number';

describe('storage utils', () => {
  let originalStorageDescriptor: PropertyDescriptor | undefined;
  let mockStorage: MockStorage;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockStorage = new MockStorage();
    originalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: mockStorage,
    });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    if (originalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalStorageDescriptor);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (window as unknown as Record<string, unknown>).localStorage;
    }
  });

  it('loads and filters values using the provided type guard', () => {
    mockStorage.setItem(STORAGE_KEY, JSON.stringify([1, 'two', 3, null, 4]));

    const result = loadArrayFromStorage(STORAGE_KEY, isNumber);

    expect(result).toEqual([1, 3, 4]);
  });

  it('returns an empty array if stored data is invalid JSON or not an array', () => {
    mockStorage.setItem(STORAGE_KEY, '{');
    expect(loadArrayFromStorage(STORAGE_KEY, isNumber)).toEqual([]);

    mockStorage.setItem(STORAGE_KEY, JSON.stringify({ value: [1, 2, 3] }));
    expect(loadArrayFromStorage(STORAGE_KEY, isNumber)).toEqual([]);

    expect(warnSpy).toHaveBeenCalled();
  });

  it('saves arrays to localStorage as JSON strings', () => {
    const payload = [5, 6, 7];

    saveArrayToStorage(STORAGE_KEY, payload);

    expect(mockStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(payload));
  });
});

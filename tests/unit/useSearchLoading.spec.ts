/// <reference types="vitest" />

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSearchLoading } from '@/composables/useSearchLoading';
import { useSearchLoadingStore } from '@/stores/searchLoading';

describe('useSearchLoading', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('updates store state when setSearching is called', () => {
    const { isSearching, setSearching } = useSearchLoading();
    expect(isSearching.value).toBe(false);

    setSearching(true);
    expect(isSearching.value).toBe(true);

    const store = useSearchLoadingStore();
    expect(store.isSearching).toBe(true);
  });

  it('shares state across multiple composable instances', () => {
    const first = useSearchLoading();
    const second = useSearchLoading();

    first.setSearching(true);
    expect(second.isSearching.value).toBe(true);

    second.setSearching(false);
    expect(first.isSearching.value).toBe(false);
  });
});

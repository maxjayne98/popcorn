import { ref } from 'vue';
import { defineStore } from 'pinia';
import { loadArrayFromStorage, saveArrayToStorage } from '@/utils/storage';

export interface SavedSearch {
  id: string;
  label: string;
  query: string;
  minRating: number;
  createdAt: string;
}

const STORAGE_KEY = 'popcorn-saved-searches';

const isSavedSearch = (entry: unknown): entry is SavedSearch => {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }
  const candidate = entry as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.query === 'string' &&
    typeof candidate.minRating === 'number' &&
    (candidate.createdAt === undefined || typeof candidate.createdAt === 'string')
  );
};

export const useSearchCollectionsStore = defineStore('search-collections', () => {
  const entries = ref<SavedSearch[]>(loadArrayFromStorage(STORAGE_KEY, isSavedSearch));

  function setEntries(next: SavedSearch[]) {
    entries.value = next;
    saveArrayToStorage(STORAGE_KEY, entries.value);
  }

  function add(label: string, query: string, minRating: number) {
    const entry: SavedSearch = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      label,
      query,
      minRating,
      createdAt: new Date().toISOString(),
    };
    setEntries([entry, ...entries.value]);
    return entry.id;
  }

  function remove(id: string) {
    setEntries(entries.value.filter((item) => item.id !== id));
  }

  function clear() {
    setEntries([]);
  }

  function $reset() {
    setEntries(loadArrayFromStorage(STORAGE_KEY, isSavedSearch));
  }

  return {
    entries,
    add,
    remove,
    clear,
    $reset,
  };
});

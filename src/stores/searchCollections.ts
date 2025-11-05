import { ref } from 'vue';
import { defineStore } from 'pinia';

export interface SavedSearch {
  id: string;
  label: string;
  query: string;
  minRating: number;
  createdAt: string;
}

const STORAGE_KEY = 'popcorn-saved-searches';

function loadInitial(): SavedSearch[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => entry && typeof entry.id === 'string');
    }
  } catch (error) {
    console.warn('Failed to parse saved searches', error);
  }
  return [];
}

function persist(searches: SavedSearch[]) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch (error) {
    console.warn('Failed to persist saved searches', error);
  }
}

export const useSearchCollectionsStore = defineStore('search-collections', () => {
  const entries = ref<SavedSearch[]>(loadInitial());

  function setEntries(next: SavedSearch[]) {
    entries.value = next;
    persist(entries.value);
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
    setEntries(loadInitial());
  }

  return {
    entries,
    add,
    remove,
    clear,
    $reset,
  };
});

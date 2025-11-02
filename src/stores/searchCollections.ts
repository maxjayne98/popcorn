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

export const useSearchCollectionsStore = defineStore('search-collections', {
  state: () => ({
    entries: loadInitial() as SavedSearch[],
  }),
  actions: {
    add(label: string, query: string, minRating: number) {
      const entry: SavedSearch = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        label,
        query,
        minRating,
        createdAt: new Date().toISOString(),
      };
      this.entries = [entry, ...this.entries];
      persist(this.entries);
      return entry.id;
    },
    remove(id: string) {
      this.entries = this.entries.filter((item) => item.id !== id);
      persist(this.entries);
    },
    clear() {
      this.entries = [];
      persist(this.entries);
    },
  },
});

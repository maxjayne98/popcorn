import { defineStore } from 'pinia';

const STORAGE_KEY = 'popcorn-watchlist';

function loadInitialIds(): number[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((value) => typeof value === 'number');
    }
  } catch (error) {
    console.warn('Failed to parse watchlist storage', error);
  }
  return [];
}

function persistIds(ids: number[]) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.warn('Failed to persist watchlist', error);
  }
}

export const useWatchlistStore = defineStore('watchlist', {
  state: () => ({
    pinnedIds: loadInitialIds() as number[],
  }),
  getters: {
    isPinned: (state) => (id: number) => state.pinnedIds.includes(id),
  },
  actions: {
    toggle(id: number) {
      if (this.pinnedIds.includes(id)) {
        this.pinnedIds = this.pinnedIds.filter((value) => value !== id);
      } else {
        this.pinnedIds = [...this.pinnedIds, id];
      }
      persistIds(this.pinnedIds);
    },
    add(id: number) {
      if (!this.pinnedIds.includes(id)) {
        this.pinnedIds = [...this.pinnedIds, id];
        persistIds(this.pinnedIds);
      }
    },
    remove(id: number) {
      if (this.pinnedIds.includes(id)) {
        this.pinnedIds = this.pinnedIds.filter((value) => value !== id);
        persistIds(this.pinnedIds);
      }
    },
    clear() {
      this.pinnedIds = [];
      persistIds(this.pinnedIds);
    },
  },
});

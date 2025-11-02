import { defineStore } from 'pinia';
import type { TVMazeShow } from '@/types/tvmaze';

const STORAGE_KEY = 'popcorn-recently-viewed';
const MAX_RECENT = 12;

function loadInitial(): TVMazeShow[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && typeof item.id === 'number');
    }
  } catch (error) {
    console.warn('Failed to read recently viewed storage', error);
  }
  return [];
}

function persist(items: TVMazeShow[]) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Failed to persist recently viewed', error);
  }
}

export const useRecentlyViewedStore = defineStore('recently-viewed', {
  state: () => ({
    items: loadInitial() as TVMazeShow[],
  }),
  getters: {
    hasAny: (state) => state.items.length > 0,
  },
  actions: {
    add(show: TVMazeShow) {
      this.items = [show, ...this.items.filter((item) => item.id !== show.id)].slice(0, MAX_RECENT);
      persist(this.items);
    },
    remove(id: number) {
      this.items = this.items.filter((item) => item.id !== id);
      persist(this.items);
    },
    clear() {
      this.items = [];
      persist(this.items);
    },
  },
});

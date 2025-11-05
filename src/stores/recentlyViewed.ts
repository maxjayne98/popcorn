import { computed, ref } from 'vue';
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

export const useRecentlyViewedStore = defineStore('recently-viewed', () => {
  const items = ref<TVMazeShow[]>(loadInitial());

  const hasAny = computed(() => items.value.length > 0);

  function updateItems(next: TVMazeShow[]) {
    items.value = next;
    persist(items.value);
  }

  function add(show: TVMazeShow) {
    updateItems([show, ...items.value.filter((item) => item.id !== show.id)].slice(0, MAX_RECENT));
  }

  function remove(id: number) {
    updateItems(items.value.filter((item) => item.id !== id));
  }

  function clear() {
    updateItems([]);
  }

  function $reset() {
    updateItems(loadInitial());
  }

  return {
    items,
    hasAny,
    add,
    remove,
    clear,
    $reset,
  };
});

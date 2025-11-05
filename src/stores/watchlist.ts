import { ref } from 'vue';
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

export const useWatchlistStore = defineStore('watchlist', () => {
  const pinnedIds = ref<number[]>(loadInitialIds());

  function setPinnedIds(ids: number[]) {
    pinnedIds.value = ids;
    persistIds(ids);
  }

  function toggle(id: number) {
    if (pinnedIds.value.includes(id)) {
      setPinnedIds(pinnedIds.value.filter((value) => value !== id));
    } else {
      setPinnedIds([...pinnedIds.value, id]);
    }
  }

  function add(id: number) {
    if (!pinnedIds.value.includes(id)) {
      setPinnedIds([...pinnedIds.value, id]);
    }
  }

  function remove(id: number) {
    if (pinnedIds.value.includes(id)) {
      setPinnedIds(pinnedIds.value.filter((value) => value !== id));
    }
  }

  function clear() {
    setPinnedIds([]);
  }

  function $reset() {
    setPinnedIds(loadInitialIds());
  }

  const isPinned = (id: number) => pinnedIds.value.includes(id);

  return {
    pinnedIds,
    isPinned,
    toggle,
    add,
    remove,
    clear,
    $reset,
  };
});

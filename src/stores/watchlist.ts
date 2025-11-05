import { ref } from 'vue';
import { defineStore } from 'pinia';
import { loadArrayFromStorage, saveArrayToStorage } from '@/utils/storage';

const STORAGE_KEY = 'popcorn-watchlist';

const isNumber = (value: unknown): value is number => typeof value === 'number';

export const useWatchlistStore = defineStore('watchlist', () => {
  const pinnedIds = ref<number[]>(loadArrayFromStorage(STORAGE_KEY, isNumber));

  function setPinnedIds(ids: number[]) {
    pinnedIds.value = ids;
    saveArrayToStorage(STORAGE_KEY, ids);
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
    setPinnedIds(loadArrayFromStorage(STORAGE_KEY, isNumber));
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

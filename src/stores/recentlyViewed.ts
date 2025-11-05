import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { TVMazeShow } from '@/types/tvmaze';
import { loadArrayFromStorage, saveArrayToStorage } from '@/utils/storage';

const STORAGE_KEY = 'popcorn-recently-viewed';
const MAX_RECENT = 12;

const isValidShow = (item: unknown): item is TVMazeShow =>
  typeof item === 'object' && item !== null && typeof (item as TVMazeShow).id === 'number';

export const useRecentlyViewedStore = defineStore('recently-viewed', () => {
  const items = ref<TVMazeShow[]>(loadArrayFromStorage(STORAGE_KEY, isValidShow));

  const hasAny = computed(() => items.value.length > 0);

  function updateItems(next: TVMazeShow[]) {
    items.value = next;
    saveArrayToStorage(STORAGE_KEY, items.value);
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
    updateItems(loadArrayFromStorage(STORAGE_KEY, isValidShow));
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

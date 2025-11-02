import { defineStore } from 'pinia';

export const useSearchLoadingStore = defineStore('search-loading', {
  state: () => ({
    isSearching: false,
  }),
  actions: {
    setSearching(value: boolean) {
      this.isSearching = value;
    },
  },
});

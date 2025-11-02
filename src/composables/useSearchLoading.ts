import { storeToRefs } from 'pinia';
import { useSearchLoadingStore } from '@/stores/searchLoading';

export function useSearchLoading() {
  const store = useSearchLoadingStore();
  const { isSearching } = storeToRefs(store);

  return {
    isSearching,
    setSearching: store.setSearching,
  };
}

export type UseSearchLoadingReturn = ReturnType<typeof useSearchLoading>;

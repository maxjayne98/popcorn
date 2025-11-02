import { storeToRefs } from 'pinia';
import { useShowCatalogStore } from '@/stores/showCatalog';

export function useShowCatalog() {
  const store = useShowCatalogStore();
  const { allShows, genreCollections, isLoading, error } = storeToRefs(store);

  return {
    allShows,
    genreCollections,
    isLoading,
    error,
    loadShows: store.loadShows,
    ensureShow: store.ensureShow,
    searchShows: store.searchShows,
  };
}

export type UseShowCatalogReturn = ReturnType<typeof useShowCatalog>;

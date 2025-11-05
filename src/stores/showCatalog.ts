import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import * as tvmazeApi from '@/api/tvmaze';
import type { SearchResult, TVMazeShow } from '@/types/tvmaze';

const DEFAULT_PAGES = [0, 1, 2, 3, 4];

interface GenreCollection {
  genre: string;
  shows: TVMazeShow[];
}

function sortShowsByRating(shows: Iterable<TVMazeShow>): TVMazeShow[] {
  return [...shows].sort((a, b) => {
    const ratingA = a.rating?.average ?? 0;
    const ratingB = b.rating?.average ?? 0;
    if (ratingA === ratingB) {
      return a.name.localeCompare(b.name);
    }
    return ratingB - ratingA;
  });
}

export const useShowCatalogStore = defineStore('show-catalog', () => {
  const allShows = ref<TVMazeShow[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const showsIndex = reactive(new Map<number, TVMazeShow>());
  const loadedPages = reactive(new Set<number>());
  const searchCache = reactive(new Map<string, SearchResult[]>());

  const genreCollections = computed<GenreCollection[]>(() => {
    const collections = new Map<string, TVMazeShow[]>();

    for (const show of allShows.value) {
      for (const genre of show.genres) {
        if (!collections.has(genre)) {
          collections.set(genre, []);
        }
        collections.get(genre)!.push(show);
      }
    }

    return [...collections.entries()]
      .map(([genre, shows]) => ({
        genre,
        shows: sortShowsByRating(shows),
      }))
      .sort((a, b) => a.genre.localeCompare(b.genre));
  });

  async function loadShows(pages: number[] = DEFAULT_PAGES) {
    const pagesToFetch = pages.filter((page) => !loadedPages.has(page));
    if (!pagesToFetch.length || isLoading.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const responses = await Promise.all(pagesToFetch.map((page) => tvmazeApi.fetchShowsPage(page)));
      pagesToFetch.forEach((page) => loadedPages.add(page));

      let hasMutated = false;
      for (const shows of responses) {
        for (const show of shows) {
          if (!showsIndex.has(show.id)) {
            showsIndex.set(show.id, show);
            hasMutated = true;
          }
        }
      }

      if (hasMutated) {
        allShows.value = sortShowsByRating(showsIndex.values());
      }
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Unknown error';
    } finally {
      isLoading.value = false;
    }
  }

  async function ensureShow(id: number): Promise<TVMazeShow | null> {
    const existing = showsIndex.get(id);
    if (existing && existing.summary) {
      return existing;
    }

    try {
      const show = await tvmazeApi.fetchShowById(id);
      showsIndex.set(show.id, show);
      allShows.value = sortShowsByRating(showsIndex.values());
      return show;
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Unknown error';
      return existing ?? null;
    }
  }

  async function searchShows(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    if (searchCache.has(normalized)) {
      return searchCache.get(normalized)!;
    }

    const results = await tvmazeApi.searchShowsByName(normalized, signal);
    searchCache.set(normalized, results);

    for (const { show } of results) {
      if (!showsIndex.has(show.id)) {
        showsIndex.set(show.id, show);
      } else {
        const cached = showsIndex.get(show.id)!;
        showsIndex.set(show.id, { ...cached, ...show });
      }
    }

    allShows.value = sortShowsByRating(showsIndex.values());
    return results;
  }

  function $reset() {
    allShows.value = [];
    isLoading.value = false;
    error.value = null;
    showsIndex.clear();
    loadedPages.clear();
    searchCache.clear();
  }

  return {
    allShows,
    isLoading,
    error,
    showsIndex,
    loadedPages,
    searchCache,
    genreCollections,
    loadShows,
    ensureShow,
    searchShows,
    $reset,
  };
});

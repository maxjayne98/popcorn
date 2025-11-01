import { computed, readonly, ref } from 'vue';
import { fetchShowById, fetchShowsPage, searchShowsByName } from '@/api/tvmaze';
import type { SearchResult, TVMazeShow } from '@/types/tvmaze';

const DEFAULT_PAGES = [0, 1, 2, 3, 4];

interface GenreCollection {
  genre: string;
  shows: TVMazeShow[];
}

const showsIndex = new Map<number, TVMazeShow>();
const allShows = ref<TVMazeShow[]>([]);
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const loadedPages = new Set<number>();
const searchCache = new Map<string, SearchResult[]>();

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

async function loadShows(pages: number[] = DEFAULT_PAGES): Promise<void> {
  const pagesToFetch = pages.filter((page) => !loadedPages.has(page));
  if (!pagesToFetch.length || isLoading.value) {
    return;
  }

  isLoading.value = true;
  loadError.value = null;

  try {
    const responses = await Promise.all(pagesToFetch.map((page) => fetchShowsPage(page)));
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
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unknown error';
  } finally {
    isLoading.value = false;
  }
}

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

async function ensureShow(id: number): Promise<TVMazeShow | null> {
  const existing = showsIndex.get(id);
  if (existing && existing.summary) {
    return existing;
  }

  try {
    const show = await fetchShowById(id);
    showsIndex.set(show.id, show);
    allShows.value = sortShowsByRating(showsIndex.values());
    return show;
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unknown error';
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

  const results = await searchShowsByName(normalized, signal);
  searchCache.set(normalized, results);

  for (const result of results) {
    const { show } = result;
    if (!showsIndex.has(show.id)) {
      showsIndex.set(show.id, show);
    } else {
      // Merge summary or higher fidelity data if the cache has a lean representation.
      const cached = showsIndex.get(show.id)!;
      showsIndex.set(show.id, { ...cached, ...show });
    }
  }

  allShows.value = sortShowsByRating(showsIndex.values());
  return results;
}

export function useShowCatalog() {
  return {
    allShows: readonly(allShows),
    genreCollections,
    isLoading: readonly(isLoading),
    error: readonly(loadError),
    loadShows,
    ensureShow,
    searchShows,
  };
}

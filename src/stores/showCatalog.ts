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

export const useShowCatalogStore = defineStore('show-catalog', {
  state: () => ({
    allShows: [] as TVMazeShow[],
    isLoading: false,
    error: null as string | null,
    showsIndex: new Map<number, TVMazeShow>(),
    loadedPages: new Set<number>(),
    searchCache: new Map<string, SearchResult[]>(),
  }),
  getters: {
    genreCollections(state): GenreCollection[] {
      const collections = new Map<string, TVMazeShow[]>();

      for (const show of state.allShows) {
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
    },
  },
  actions: {
    async loadShows(pages: number[] = DEFAULT_PAGES) {
      const pagesToFetch = pages.filter((page) => !this.loadedPages.has(page));
      if (!pagesToFetch.length || this.isLoading) {
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const responses = await Promise.all(pagesToFetch.map((page) => tvmazeApi.fetchShowsPage(page)));
        pagesToFetch.forEach((page) => this.loadedPages.add(page));

        let hasMutated = false;
        for (const shows of responses) {
          for (const show of shows) {
            if (!this.showsIndex.has(show.id)) {
              this.showsIndex.set(show.id, show);
              hasMutated = true;
            }
          }
        }

        if (hasMutated) {
          this.allShows = sortShowsByRating(this.showsIndex.values());
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      } finally {
        this.isLoading = false;
      }
    },
    async ensureShow(id: number): Promise<TVMazeShow | null> {
      const existing = this.showsIndex.get(id);
      if (existing && existing.summary) {
        return existing;
      }

      try {
        const show = await tvmazeApi.fetchShowById(id);
        this.showsIndex.set(show.id, show);
        this.allShows = sortShowsByRating(this.showsIndex.values());
        return show;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        return existing ?? null;
      }
    },
    async searchShows(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        return [];
      }

      if (this.searchCache.has(normalized)) {
        return this.searchCache.get(normalized)!;
      }

      const results = await tvmazeApi.searchShowsByName(normalized, signal);
      this.searchCache.set(normalized, results);

      for (const { show } of results) {
        if (!this.showsIndex.has(show.id)) {
          this.showsIndex.set(show.id, show);
        } else {
          const cached = this.showsIndex.get(show.id)!;
          this.showsIndex.set(show.id, { ...cached, ...show });
        }
      }

      this.allShows = sortShowsByRating(this.showsIndex.values());
      return results;
    },
  },
});

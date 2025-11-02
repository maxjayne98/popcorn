/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useShowCatalogStore } from '@/stores/showCatalog';
import type { SearchResult, TVMazeShow } from '@/types/tvmaze';

const apiMocks = vi.hoisted(() => ({
  fetchShowsPage: vi.fn<[number, AbortSignal?], Promise<TVMazeShow[]>>(),
  fetchShowById: vi.fn<[number, AbortSignal?], Promise<TVMazeShow>>(),
  searchShowsByName: vi.fn<[string, AbortSignal?], Promise<SearchResult[]>>(),
}));

vi.mock('@/api/tvmaze', () => apiMocks);

function createShow(overrides: Partial<TVMazeShow> = {}): TVMazeShow {
  const base: TVMazeShow = {
    id: 1,
    name: 'Base Show',
    genres: ['Drama'],
    type: 'Scripted',
    language: 'English',
    runtime: null,
    premiered: null,
    ended: null,
    schedule: { time: '', days: [] },
    rating: { average: null },
    image: null,
    summary: null,
    url: 'https://example.com/show',
    officialSite: null,
    status: 'Running',
    network: null,
    externals: undefined,
  };

  return {
    ...base,
    ...overrides,
    genres: overrides.genres ?? base.genres,
    schedule: overrides.schedule ?? base.schedule,
    rating: overrides.rating ?? base.rating,
    image: 'image' in overrides ? overrides.image ?? null : base.image,
    network: 'network' in overrides ? overrides.network ?? null : base.network,
  };
}

describe('useShowCatalogStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    apiMocks.fetchShowsPage.mockReset();
    apiMocks.fetchShowById.mockReset();
    apiMocks.searchShowsByName.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads shows and populates state', async () => {
    const store = useShowCatalogStore();
    const shows = [
      createShow({ id: 1, name: 'Alpha', rating: { average: 8 } }),
      createShow({ id: 2, name: 'Beta', rating: { average: 9 }, genres: ['Comedy'] }),
    ];
    apiMocks.fetchShowsPage.mockResolvedValueOnce(shows);

    await store.loadShows([0]);

    expect(apiMocks.fetchShowsPage).toHaveBeenCalledWith(0);
    expect(store.allShows.map((show) => show.name)).toEqual(['Beta', 'Alpha']);
    expect(store.genreCollections).toEqual([
      { genre: 'Comedy', shows: [shows[1]] },
      { genre: 'Drama', shows: [shows[0]] },
    ]);
  });

  it('prevents duplicate fetches for loaded pages', async () => {
    const store = useShowCatalogStore();
    apiMocks.fetchShowsPage.mockResolvedValue(createShowList(2));

    await store.loadShows([0]);
    await store.loadShows([0]);

    expect(apiMocks.fetchShowsPage).toHaveBeenCalledTimes(1);
  });

  it('handles load errors and resets loading flag', async () => {
    const store = useShowCatalogStore();
    apiMocks.fetchShowsPage.mockRejectedValueOnce(new Error('network down'));

    await store.loadShows([1]);

    expect(store.error).toBe('network down');
    expect(store.isLoading).toBe(false);
  });

  it('ensures show details and keeps existing data on failure', async () => {
    const store = useShowCatalogStore();
    const lean = createShow({ id: 10, summary: null });
    apiMocks.fetchShowsPage.mockResolvedValueOnce([lean]);
    await store.loadShows([0]);

    const full = createShow({ id: 10, summary: '<p>Details</p>' });
    apiMocks.fetchShowById.mockResolvedValueOnce(full);

    const result = await store.ensureShow(10);
    expect(apiMocks.fetchShowById).toHaveBeenCalledWith(10);
    expect(result?.summary).toBe('<p>Details</p>');

    const fallbackShow = createShow({ id: 99, summary: null });
    store.showsIndex.set(99, fallbackShow);
    store.allShows = [fallbackShow];

    apiMocks.fetchShowById.mockRejectedValueOnce(new Error('boom'));
    const fallback = await store.ensureShow(99);
    expect(apiMocks.fetchShowById).toHaveBeenCalledWith(99);
    expect(fallback?.id).toBe(99);
    expect(store.error).toBe('boom');
  });

  it('searches shows, caches hits, and merges into index', async () => {
    const store = useShowCatalogStore();
    const results: SearchResult[] = [
      { score: 1, show: createShow({ id: 5, name: 'Search One', rating: { average: 7 } }) },
      { score: 0.8, show: createShow({ id: 6, name: 'Search Two', rating: { average: 8 } }) },
    ];
    apiMocks.searchShowsByName.mockResolvedValueOnce(results);

    const first = await store.searchShows(' Demo ');
    const second = await store.searchShows('demo');

    expect(apiMocks.searchShowsByName).toHaveBeenCalledTimes(1);
    expect(first.map((entry) => entry.show.id)).toEqual([5, 6]);
    expect(second).toEqual(first);
    expect(store.allShows.map((show) => show.id)).toEqual([6, 5]);
  });
});

function createShowList(count: number): TVMazeShow[] {
  return Array.from({ length: count }, (_, index) =>
    createShow({
      id: index + 1,
      name: `Show ${index + 1}`,
      genres: ['Drama'],
      rating: { average: 5 + index },
    })
  );
}

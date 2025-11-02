/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import type { SearchResult, TVMazeShow } from '@/types/tvmaze';

const fetchShowsPage = vi.fn<[number, AbortSignal?], Promise<TVMazeShow[]>>();
const fetchShowById = vi.fn<[number, AbortSignal?], Promise<TVMazeShow>>();
const searchShowsByName = vi.fn<[string, AbortSignal?], Promise<SearchResult[]>>();

vi.mock('@/api/tvmaze', () => ({
  fetchShowsPage,
  fetchShowById,
  searchShowsByName,
}));

function createShow(overrides: Partial<TVMazeShow> = {}): TVMazeShow {
  const base: TVMazeShow = {
    id: Math.floor(Math.random() * 10000),
    name: 'Test Show',
    genres: [],
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

async function loadComposable() {
  setActivePinia(createPinia());
  const module = await import('@/composables/useShowCatalog');
  return module.useShowCatalog();
}

describe('useShowCatalog', () => {
  beforeEach(() => {
    fetchShowsPage.mockReset();
    fetchShowById.mockReset();
    searchShowsByName.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads show pages and sorts results by rating and name', async () => {
    const shows = [
      createShow({
        id: 1,
        name: 'Bravo',
        rating: { average: 8 },
        genres: ['Drama', 'Mystery'],
      }),
      createShow({
        id: 2,
        name: 'Alpha',
        rating: { average: 8 },
        genres: ['Drama', 'Sci-Fi'],
      }),
      createShow({
        id: 3,
        name: 'Charlie',
        rating: { average: 6.5 },
        genres: ['Comedy'],
      }),
    ];

    fetchShowsPage.mockResolvedValueOnce(shows);

    const catalog = await loadComposable();
    await catalog.loadShows([0]);

    expect(fetchShowsPage).toHaveBeenCalledWith(0);
    expect(catalog.allShows.value.map((show) => show.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);

    const genreSummary = catalog.genreCollections.value.map((collection) => ({
      genre: collection.genre,
      showNames: collection.shows.map((show) => show.name),
    }));

    expect(genreSummary).toEqual([
      { genre: 'Comedy', showNames: ['Charlie'] },
      { genre: 'Drama', showNames: ['Alpha', 'Bravo'] },
      { genre: 'Mystery', showNames: ['Bravo'] },
      { genre: 'Sci-Fi', showNames: ['Alpha'] },
    ]);
  });

  it('avoids refetching already loaded pages', async () => {
    const catalog = await loadComposable();
    fetchShowsPage.mockResolvedValue(createShowList(2));

    await catalog.loadShows([0, 1]);
    await catalog.loadShows([0, 1]);

    expect(fetchShowsPage).toHaveBeenCalledTimes(2);
  });

  it('fills missing data via ensureShow and updates cache', async () => {
    const partial = createShow({ id: 11, name: 'Cached', summary: null });

    fetchShowsPage.mockResolvedValueOnce([partial]);
    const full = createShow({
      id: 11,
      name: 'Cached',
      summary: '<p>Available</p>',
      rating: { average: 9 },
      genres: ['Thriller'],
    });
    fetchShowById.mockResolvedValueOnce(full);

    const catalog = await loadComposable();
    await catalog.loadShows([0]);
    const result = await catalog.ensureShow(11);

    expect(fetchShowById).toHaveBeenCalledWith(11);
    expect(result?.summary).toContain('Available');
    expect(catalog.allShows.value.find((show) => show.id === 11)?.rating?.average).toBe(9);
  });

  it('returns cached show when fetchShowById fails', async () => {
    const cached = createShow({ id: 22, name: 'Fallback', summary: null });

    fetchShowsPage.mockResolvedValueOnce([cached]);
    fetchShowById.mockRejectedValueOnce(new Error('boom'));

    const catalog = await loadComposable();
    await catalog.loadShows([0]);
    const result = await catalog.ensureShow(22);

    expect(result?.name).toBe('Fallback');
    expect(catalog.error.value).toBe('boom');
  });

  it('searches shows, caches results, and merges into index', async () => {
    const searchResults: SearchResult[] = [
      { score: 1, show: createShow({ id: 101, name: 'Search Hit', rating: { average: 7 }, genres: ['Drama'] }) },
      { score: 0.8, show: createShow({ id: 102, name: 'Another', rating: { average: 8 }, genres: ['Comedy'] }) },
    ];

    searchShowsByName.mockResolvedValueOnce(searchResults);

    const catalog = await loadComposable();
    const resultsFirst = await catalog.searchShows('  Search  ');
    const resultsSecond = await catalog.searchShows('search');

    expect(searchShowsByName).toHaveBeenCalledTimes(1);
    expect(resultsFirst.map((entry) => entry.show.id)).toEqual([101, 102]);
    expect(resultsSecond).toEqual(resultsFirst);
    expect(catalog.allShows.value.map((show) => show.id)).toEqual([102, 101]);
  });

  it('sets load error when loadShows rejects', async () => {
    fetchShowsPage.mockRejectedValueOnce(new Error('Nope'));

    const catalog = await loadComposable();
    await catalog.loadShows([4]);

    expect(catalog.error.value).toBe('Nope');
    expect(catalog.isLoading.value).toBe(false);
  });
});

function createShowList(count: number): TVMazeShow[] {
  return Array.from({ length: count }, (_, index) =>
    createShow({
      id: index + 1,
      name: `Show ${index + 1}`,
      genres: index % 2 === 0 ? ['Drama'] : ['Comedy'],
      rating: { average: 5 + index },
    })
  );
}

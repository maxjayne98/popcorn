/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, ref, type Ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import HomeView from '@/views/HomeView.vue';
import type { TVMazeShow, SearchResult } from '@/types/tvmaze';
import { useSearchLoadingStore } from '@/stores/searchLoading';

let allShowsRef: Ref<TVMazeShow[]>;
let genreCollectionsRef: Ref<Array<{ genre: string; shows: TVMazeShow[] }>>;
let isLoadingRef: Ref<boolean>;
let errorRef: Ref<string | null>;
let loadShowsMock: ReturnType<typeof vi.fn>;
let ensureShowMock: ReturnType<typeof vi.fn>;
let searchShowsMock: ReturnType<typeof vi.fn>;
let routerMock: { push: ReturnType<typeof vi.fn>; };
let searchStore: ReturnType<typeof useSearchLoadingStore>;

vi.mock('@/composables/useShowCatalog', () => ({
  useShowCatalog: () => ({
    allShows: allShowsRef,
    genreCollections: genreCollectionsRef,
    isLoading: isLoadingRef,
    error: errorRef,
    loadShows: loadShowsMock,
    ensureShow: ensureShowMock,
    searchShows: searchShowsMock,
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => routerMock,
}));

const ShowCardStub = defineComponent({
  name: 'ShowCardStub',
  props: {
    show: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return () => h('div', { class: 'show-card-stub' }, props.show.name);
  },
});

const GenreRailStub = defineComponent({
  name: 'GenreRailStub',
  props: {
    genre: {
      type: String,
      required: true,
    },
    shows: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h(
        'section',
        { class: 'genre-rail-stub' },
        `${props.genre}: ${(props.shows as TVMazeShow[]).map((show) => show.name).join(', ')}`
      );
  },
});

const SearchResultsListStub = defineComponent({
  name: 'SearchResultsListStub',
  props: {
    shows: {
      type: Array,
      default: () => [],
    },
  },
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'search-results-stub' },
        (props.shows as TVMazeShow[]).map((show) => show.name).join(', ')
      );
  },
});

function createShow(overrides: Partial<TVMazeShow> = {}): TVMazeShow {
  const base: TVMazeShow = {
    id: 1,
    name: 'Prime Show',
    genres: ['Drama'],
    type: 'Scripted',
    language: 'English',
    runtime: 60,
    premiered: '2020-01-01',
    ended: null,
    schedule: { time: '21:00', days: ['Monday'] },
    rating: { average: 8.5 },
    image: { original: 'https://example.com/image.jpg', medium: 'https://example.com/image_medium.jpg' },
    summary: '<p>Summary</p>',
    url: 'https://example.com/show',
    officialSite: null,
    status: 'Running',
    network: { id: 2, name: 'Network', country: { name: 'USA', code: 'US', timezone: 'America/New_York' } },
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

function createSearchResult(show: TVMazeShow, score = 1): SearchResult {
  return { score, show };
}

describe('HomeView', () => {
  beforeEach(() => {
    allShowsRef = ref<TVMazeShow[]>([]);
    genreCollectionsRef = ref([]);
    isLoadingRef = ref(false);
    errorRef = ref(null);

    loadShowsMock = vi.fn().mockResolvedValue(undefined);
    ensureShowMock = vi.fn();
    searchShowsMock = vi.fn();
    routerMock = {
      push: vi.fn(),
    };

    setActivePinia(createPinia());
    searchStore = useSearchLoadingStore();
    searchStore.$reset();

    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads shows on mount and renders hero/top picks when data becomes available', async () => {
    const topShow = createShow({
      id: 10,
      name: 'Top Rated',
      rating: { average: 9.8 },
    });
    const secondaryShow = createShow({
      id: 11,
      name: 'Runner Up',
      rating: { average: 9.1 },
    });

    const wrapper = mount(HomeView, {
      props: {
        searchQuery: '',
      },
      global: {
        stubs: {
          ShowCard: ShowCardStub,
          GenreRail: GenreRailStub,
          SearchResultsList: SearchResultsListStub,
        },
      },
    });

    expect(loadShowsMock).toHaveBeenCalledTimes(1);

    allShowsRef.value = [topShow, secondaryShow];
    genreCollectionsRef.value = [
      { genre: 'Drama', shows: [topShow, secondaryShow] },
    ];

    await flushPromises();

    const heroTitle = wrapper.find('.hero__content h1');
    expect(heroTitle.exists()).toBe(true);
    expect(heroTitle.text()).toBe('Top Rated');

    const subtitle = wrapper.find('.hero__subtitle');
    expect(subtitle.text()).toContain('Browsing 2 shows');

    const topCards = wrapper.findAll('.show-card-stub');
    expect(topCards.length).toBeGreaterThan(0);
    expect(topCards.at(0)?.text()).toBe('Runner Up');
  });

  it('performs search when query is provided and displays results', async () => {
    const searchHit = createShow({ id: 21, name: 'Search Hit', rating: { average: 8.7 } });
    const secondaryHit = createShow({ id: 22, name: 'Secondary', rating: { average: 7.5 } });
    searchShowsMock.mockResolvedValue([
      createSearchResult(searchHit, 1),
      createSearchResult(secondaryHit, 0.9),
    ]);
    const setSearchingSpy = vi.spyOn(searchStore, 'setSearching');

    const wrapper = mount(HomeView, {
      props: {
        searchQuery: ' Lost ',
      },
      global: {
        stubs: {
          ShowCard: ShowCardStub,
          GenreRail: GenreRailStub,
          SearchResultsList: SearchResultsListStub,
        },
      },
    });

    await flushPromises();

    expect(searchShowsMock).toHaveBeenCalledTimes(1);
    const [queryArg, signalArg] = searchShowsMock.mock.calls[0]!;
    expect(queryArg).toBe('Lost');
    expect(signalArg).toBeInstanceOf(AbortSignal);

    expect(setSearchingSpy).toHaveBeenCalledWith(true);
    expect(setSearchingSpy).toHaveBeenCalledWith(false);
    expect(searchStore.isSearching).toBe(false);

    const resultsStub = wrapper.find('.search-results-stub');
    expect(resultsStub.exists()).toBe(true);
    expect(resultsStub.text()).toContain('Search Hit');
    expect(resultsStub.text()).toContain('Secondary');
  });

  it('surfaces search errors when the request fails', async () => {
    searchShowsMock.mockRejectedValue(new Error('Search offline'));
    const setSearchingSpy = vi.spyOn(searchStore, 'setSearching');
    const wrapper = mount(HomeView, {
      props: {
        searchQuery: 'Drama',
      },
      global: {
        stubs: {
          ShowCard: ShowCardStub,
          GenreRail: GenreRailStub,
          SearchResultsList: SearchResultsListStub,
        },
      },
    });

    await flushPromises();

    const errorMessage = wrapper.find('.state--error');
    expect(errorMessage.exists()).toBe(true);
    expect(errorMessage.text()).toContain('Search offline');
    expect(setSearchingSpy).toHaveBeenCalledWith(true);
    expect(setSearchingSpy).toHaveBeenLastCalledWith(false);
    expect(searchStore.isSearching).toBe(false);
  });

  it('renders catalog error state when loading fails', async () => {
    const wrapper = mount(HomeView, {
      props: {
        searchQuery: '',
      },
      global: {
        stubs: {
          ShowCard: ShowCardStub,
          GenreRail: GenreRailStub,
          SearchResultsList: SearchResultsListStub,
        },
      },
    });

    errorRef.value = 'API unavailable';
    await flushPromises();

    const catalogError = wrapper.find('.state--error');
    expect(catalogError.text()).toContain('Unable to load shows right now. API unavailable');

    errorRef.value = null;
    isLoadingRef.value = true;
    genreCollectionsRef.value = [];
    await flushPromises();

    const loadingState = wrapper.find('.state');
    expect(loadingState.text()).toContain('Loading shows...');
  });

  it('uses hero actions to navigate or open external links', async () => {
    const windowOpen = vi.spyOn(window, 'open').mockReturnValue(null);
    const heroShow = createShow({
      id: 50,
      name: 'Heroic',
      officialSite: 'https://hero.example',
      image: { original: 'https://example.com/hero.jpg' },
      rating: { average: 9.2 },
    });
    const secondary = createShow({
      id: 51,
      name: 'Backup',
      image: { original: 'https://example.com/backup.jpg' },
    });

    const wrapper = mount(HomeView, {
      props: {
        searchQuery: '',
      },
      global: {
        stubs: {
          ShowCard: ShowCardStub,
          GenreRail: GenreRailStub,
          SearchResultsList: SearchResultsListStub,
        },
      },
    });

    allShowsRef.value = [heroShow, secondary];
    await flushPromises();

    await wrapper.get('.hero__button--primary').trigger('click');
    expect(windowOpen).toHaveBeenCalledWith('https://hero.example', '_blank', 'noopener');

    const buttons = wrapper.findAll('.hero__button');
    expect(buttons).toHaveLength(2);
    await buttons[1]!.trigger('click');
    expect(routerMock.push).toHaveBeenCalledWith({ name: 'show-details', params: { id: 50 } });

    windowOpen.mockRestore();
  });
});

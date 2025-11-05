/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, reactive } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import SearchResultsView from '@/views/SearchResultsView.vue';
import type { TVMazeShow, SearchResult } from '@/types/tvmaze';
import { useSearchCollectionsStore } from '@/stores/searchCollections';

let searchShowsMock: ReturnType<typeof vi.fn>;
let routeMock: { query: Record<string, unknown> };
let routerMock: { push: ReturnType<typeof vi.fn> };
let searchCollectionsStore: ReturnType<typeof useSearchCollectionsStore>;

vi.mock('@/composables/useShowCatalog', () => ({
  useShowCatalog: () => ({
    searchShows: searchShowsMock,
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => routerMock,
}));

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

function createGlobalOptions() {
  return {
    stubs: {
      SearchResultsList: SearchResultsListStub,
    },
  };
}

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

describe('SearchResultsView', () => {
  beforeEach(() => {
    searchShowsMock = vi.fn();
    routeMock = reactive({ query: reactive<Record<string, unknown>>({}) });
    routerMock = {
      push: vi.fn().mockResolvedValue(undefined),
    };

    setActivePinia(createPinia());
    searchCollectionsStore = useSearchCollectionsStore();
    searchCollectionsStore.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs a search when a query parameter is present', async () => {
    const searchHit = createShow({ id: 21, name: 'Search Hit', rating: { average: 8.7 } });
    const secondaryHit = createShow({ id: 22, name: 'Secondary', rating: { average: 7.5 } });
    searchShowsMock.mockResolvedValue([
      createSearchResult(searchHit, 1),
      createSearchResult(secondaryHit, 0.9),
    ]);
    routeMock.query.q = '  Lost  ';

    const wrapper = mount(SearchResultsView, {
      global: createGlobalOptions(),
    });

    await flushPromises();

    expect(searchShowsMock).toHaveBeenCalledWith('Lost', expect.any(AbortSignal));
    expect(wrapper.vm.isSearching).toBe(false);

    const resultsStub = wrapper.find('.search-results-stub');
    expect(resultsStub.exists()).toBe(true);
    expect(resultsStub.text()).toContain('Search Hit');
    expect(resultsStub.text()).toContain('Secondary');
  });

  it('filters results when the minimum rating slider changes', async () => {
    const highRated = createShow({ id: 30, name: 'Elite', rating: { average: 9.1 } });
    const lowRated = createShow({ id: 31, name: 'Casual', rating: { average: 6.2 } });
    searchShowsMock.mockResolvedValue([
      createSearchResult(highRated, 1),
      createSearchResult(lowRated, 0.8),
    ]);
    routeMock.query.q = 'Space';

    const wrapper = mount(SearchResultsView, {
      global: createGlobalOptions(),
    });

    await flushPromises();
    const slider = wrapper.get("input[type='range']");
    await slider.setValue('8');
    await flushPromises();

    const resultsStub = wrapper.find('.search-results-stub');
    expect(resultsStub.text()).toContain('Elite');
    expect(resultsStub.text()).not.toContain('Casual');
  });

  it('does not search when the query is empty', async () => {
    routeMock.query.q = '';

    mount(SearchResultsView, {
      global: createGlobalOptions(),
    });

    await flushPromises();
    expect(searchShowsMock).not.toHaveBeenCalled();
  });

  it('shows an error message when the search fails', async () => {
    searchShowsMock.mockRejectedValue(new Error('Search offline'));
    routeMock.query.q = 'Drama';

    const wrapper = mount(SearchResultsView, {
      global: createGlobalOptions(),
    });

    await flushPromises();

    const errorMessage = wrapper.find('.state--error');
    expect(errorMessage.exists()).toBe(true);
    expect(errorMessage.text()).toContain('Search offline');
    expect(wrapper.vm.isSearching).toBe(false);
  });

  it('applies a saved search shortcut and updates the route', async () => {
    const now = new Date().toISOString();
    searchCollectionsStore.entries = [
      { id: 'saved-1', label: 'Favourites', query: 'Mystery', minRating: 8.5, createdAt: now },
    ];
    searchShowsMock.mockResolvedValue([]);
    routeMock.query.q = 'Mystery';

    const wrapper = mount(SearchResultsView, {
      global: createGlobalOptions(),
    });

    await flushPromises();

    const buttons = wrapper.findAll('.saved-searches__list button');
    expect(buttons).toHaveLength(2);
    await buttons[0]!.trigger('click');

    expect(routerMock.push).toHaveBeenCalledWith({
      name: 'search-results',
      query: { q: 'Mystery', minRating: '8.5' },
    });
  });
});

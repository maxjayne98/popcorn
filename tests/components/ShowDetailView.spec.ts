/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useRecentlyViewedStore } from '@/stores/recentlyViewed';
import ShowDetailView from '@/views/ShowDetailView.vue';

const ensureShow = vi.fn<(id: number, signal?: AbortSignal) => Promise<unknown>>();
const back = vi.fn();
const push = vi.fn();

vi.mock('@/composables/useShowCatalog', () => ({
  useShowCatalog: () => ({
    ensureShow,
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    back,
    push,
  }),
  RouterLink: RouterLinkStub,
}));

beforeEach(() => {
  setActivePinia(createPinia());
  useRecentlyViewedStore().clear();
  ensureShow.mockReset();
  back.mockReset();
  push.mockReset();
});

function createShow(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    name: 'My Show',
    genres: ['Drama', 'Mystery'],
    type: 'Scripted',
    language: 'English',
    runtime: 60,
    premiered: '2015-01-01',
    ended: null,
    schedule: { time: '21:00', days: ['Monday', 'Thursday'] },
    rating: { average: 8.3 },
    image: { medium: 'https://example.com/poster.jpg' },
    summary: '<p>An intriguing mystery.</p>',
    url: 'https://example.com',
    officialSite: 'https://official.com',
    status: 'Running',
    network: { id: 1, name: 'HBO', country: { name: 'USA', code: 'US', timezone: 'America/New_York' } },
    externals: {},
    ...overrides,
  };
}

function mountView(id: string) {
  return mount(ShowDetailView, {
    props: { id },
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  });
}

describe('ShowDetailView', () => {
  it('shows validation error for non-numeric ids', async () => {
    ensureShow.mockResolvedValue(null);
    const wrapper = mountView('abc');
    await flushPromises();
    expect(wrapper.text()).toContain('Invalid show identifier.');
    expect(ensureShow).not.toHaveBeenCalled();
  });

  it('renders show details when data is available', async () => {
    const show = createShow();
    ensureShow.mockResolvedValue(show);
    const store = useRecentlyViewedStore();
    const addSpy = vi.spyOn(store, 'add');

    const wrapper = mountView('7');
    await flushPromises();

    expect(wrapper.find('h1').text()).toBe('My Show');
    expect(wrapper.find('.show-detail__badge').text()).toContain('8.3');
    expect(wrapper.find('.show-detail__meta').text()).toContain('Monday, Thursday at 21:00');
    expect(wrapper.find('.show-detail__meta').text()).toContain('HBO (USA)');
    expect(wrapper.find('img[alt="My Show poster"]').attributes('src')).toBe(show.image.medium);
    expect(addSpy).toHaveBeenCalledWith(show);
  });

  it('shows placeholder when poster is missing', async () => {
    const show = createShow({ image: null });
    ensureShow.mockResolvedValue(show);

    const wrapper = mountView('7');
    await flushPromises();

    expect(wrapper.find('.show-detail__poster-placeholder').text()).toBe('M');
  });

  it('reports when the show cannot be found', async () => {
    ensureShow.mockResolvedValue(null);

    const wrapper = mountView('7');
    await flushPromises();

    expect(wrapper.text()).toContain('Show not found. It may have been removed.');
  });

  it('shows loading indicator while fetching', async () => {
    let resolveShow: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveShow = resolve;
    });
    // @ts-expect-error controlled promise assignment
    ensureShow.mockReturnValue(pending);

    const wrapper = mountView('7');

    expect(wrapper.find('.async-state--loading').exists()).toBe(true);
    resolveShow!(createShow());
    await flushPromises();

    expect(wrapper.find('.async-state--loading').exists()).toBe(false);
  });

  it('renders error state when fetch fails', async () => {
    ensureShow.mockRejectedValue(new Error('Backend unavailable'));

    const wrapper = mountView('7');
    await flushPromises();

    const errorState = wrapper.find('.async-state--error');
    expect(errorState.exists()).toBe(true);
    expect(errorState.text()).toContain('Backend unavailable');
  });

  it('navigates back or home depending on history length', async () => {
    ensureShow.mockResolvedValue(createShow());
    const wrapper = mountView('7');
    await flushPromises();

    const lengthSpy = vi.spyOn(window.history, 'length', 'get');
    lengthSpy.mockReturnValue(2);
    await wrapper.find('.back-button').trigger('click');
    expect(back).toHaveBeenCalledTimes(1);

    lengthSpy.mockReturnValue(1);
    await wrapper.find('.back-button').trigger('click');
    expect(push).toHaveBeenCalledWith({ name: 'home' });
    lengthSpy.mockRestore();
  });
});

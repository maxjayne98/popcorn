/// <reference types="vitest" />

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ShowCard from '@/components/ShowCard.vue';
import type { TVMazeShow } from '@/types/tvmaze';
import { useWatchlistStore } from '@/stores/watchlist';

function createShow(overrides: Partial<TVMazeShow> = {}): TVMazeShow {
  const base: TVMazeShow = {
    id: 5,
    name: 'Sample Show',
    genres: ['Drama', 'Sci-Fi'],
    type: 'Scripted',
    language: 'English',
    runtime: 42,
    premiered: '2020-01-01',
    ended: null,
    schedule: { time: '22:00', days: ['Friday'] },
    rating: { average: 7.4 },
    image: { medium: 'https://example.com/poster.jpg' },
    summary: '<p>Summary</p>',
    url: 'https://example.com',
    officialSite: null,
    status: 'Running',
    network: {
      id: 1,
      name: 'HBO',
      country: { name: 'US', code: 'US', timezone: 'America/New_York' },
    },
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

describe('ShowCard', () => {
  const originalShare = navigator.share;
  const originalClipboard = navigator.clipboard;
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    Object.assign(navigator, {
      share: undefined,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    navigator.share = originalShare;
    navigator.clipboard = originalClipboard;
    openSpy.mockRestore();
  });

  it('renders poster image and formatted rating', () => {
    const wrapper = mount(ShowCard, {
      props: { show: createShow() },
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });

    const image = wrapper.find('img');
    expect(image.attributes('src')).toBe('https://example.com/poster.jpg');
    expect(wrapper.find('.show-card__badge').text()).toContain('7.4');
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: 'show-details',
      params: { id: 5 },
    });
  });

  it('uses placeholder initial when poster is missing', () => {
    const wrapper = mount(ShowCard, {
      props: { show: createShow({ name: 'Echo', image: null }) },
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });

    const placeholder = wrapper.getComponent(RouterLinkStub).find('.show-card__poster-placeholder');
    expect(placeholder.exists()).toBe(true);
    expect(placeholder.text()).toBe('E');
  });

  it('falls back to language when network is unavailable', () => {
    const wrapper = mount(ShowCard, {
      props: {
        show: createShow({
          network: null,
          language: 'Spanish',
          rating: { average: null },
        }),
      },
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });

    expect(wrapper.getComponent(RouterLinkStub).find('.show-card__meta').text()).toContain('Spanish');
    expect(wrapper.find('.show-card__badge').exists()).toBe(false);
  });

  it('toggles watchlist when pin button is pressed', async () => {
    const show = createShow({ id: 42 });
    const wrapper = mount(ShowCard, {
      props: { show },
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });

    const pin = wrapper.find('.show-card__pin');
    expect(pin.attributes('aria-pressed')).toBe('false');

    await pin.trigger('click');
    const store = useWatchlistStore();
    expect(store.isPinned(42)).toBe(true);
    expect(wrapper.find('.show-card__pin').attributes('aria-pressed')).toBe('true');
  });

  it('copies link when share API is unavailable', async () => {
    const show = createShow({ id: 55 });
    const wrapper = mount(ShowCard, {
      props: { show },
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    });

    await wrapper.find('.show-card__share').trigger('click');
    expect(navigator.clipboard?.writeText).toHaveBeenCalledWith(expect.stringContaining('/shows/55'));
  });

  it('opens a tweet intent when tweet button is clicked', async () => {
    const wrapper = mount(ShowCard, {
      props: { show: createShow({ id: 99, name: 'Tweetable' }) },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    await wrapper.find('.show-card__tweet').trigger('click');
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('twitter.com/intent/tweet'), '_blank', 'noopener');
  });
});

/// <reference types="vitest" />

import { describe, it, expect } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import ShowCard from '@/components/ShowCard.vue';
import type { TVMazeShow } from '@/types/tvmaze';

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
});

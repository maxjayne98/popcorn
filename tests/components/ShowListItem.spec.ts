/// <reference types="vitest" />

import { describe, it, expect } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import ShowListItem from '@/components/ShowListItem.vue';
import type { TVMazeShow } from '@/types/tvmaze';

function createShow(overrides: Partial<TVMazeShow> = {}): TVMazeShow {
  const base: TVMazeShow = {
    id: 10,
    name: 'List Item',
    genres: ['Drama'],
    type: 'Scripted',
    language: 'English',
    runtime: 50,
    premiered: null,
    ended: null,
    schedule: { time: '', days: [] },
    rating: { average: 9.1 },
    image: { medium: 'https://example.com/list-item.jpg' },
    summary: '<p>Strong <strong>story</strong>.</p>',
    url: 'https://example.com/list',
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

describe('ShowListItem', () => {
  it('renders summary without HTML and formats rating', () => {
    const wrapper = mount(ShowListItem, {
      props: {
        show: createShow(),
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    expect(wrapper.find('.show-list-item__rating').text()).toContain('9.1');
    expect(wrapper.find('.show-list-item__body p').text()).toBe('Strong story.');
  });

  it('shows placeholder when image is missing and hides rating when absent', () => {
    const wrapper = mount(ShowListItem, {
      props: {
        show: createShow({ image: null, rating: { average: null }, name: 'Fallback' }),
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    const placeholder = wrapper
      .getComponent(RouterLinkStub)
      .find('.show-list-item__poster-placeholder');
    expect(placeholder.exists()).toBe(true);
    expect(placeholder.text()).toBe('F');
    expect(wrapper.find('.show-list-item__rating').exists()).toBe(false);
  });
});

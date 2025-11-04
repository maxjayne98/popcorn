/// <reference types="vitest" />

import { describe, it, expect } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import SearchResultsList from '@/components/SearchResultsList.vue';
import type { TVMazeShow } from '@/types/tvmaze';

const SearchResultItemStub = defineComponent({
  name: 'SearchResultItemStub',
  props: {
    show: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return () => h('article', { class: 'search-result-item-stub' }, props.show.name);
  },
});

function createShow(id: number, name: string): TVMazeShow {
  return {
    id,
    name,
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
    url: `https://example.com/${id}`,
    officialSite: null,
    status: 'Running',
    network: null,
    externals: undefined,
  };
}

describe('SearchResultsList', () => {
  it('renders cards when shows are provided', () => {
    const wrapper = mount(SearchResultsList, {
      props: {
        shows: [createShow(1, 'Alpha'), createShow(2, 'Beta')],
      },
      global: {
        stubs: {
          SearchResultItem: SearchResultItemStub,
        },
      },
    });

    const cards = wrapper.findAll('.search-result-item-stub');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.text()).toBe('Alpha');
  });

  it('shows empty state when there are no shows', () => {
    const wrapper = mount(SearchResultsList, {
      props: {
        shows: [],
      },
    });

    expect(wrapper.text()).toContain('Try refining your search keywords');
  });
});

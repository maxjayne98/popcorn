/// <reference types="vitest" />

import { describe, it, expect } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import GenreRail from '@/components/GenreRail.vue';
import type { TVMazeShow } from '@/types/tvmaze';

const VirtualStub = defineComponent({
  name: 'VirtualStub',
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        { class: 'virtual-stub' },
        props.items.map((item, index) =>
          slots.default ? slots.default({ item, index }) : null
        )
      );
  },
});

const ShowCardStub = defineComponent({
  name: 'ShowCardStub',
  props: {
    show: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return () => h('article', { class: 'show-card-stub' }, props.show.name);
  },
});

function createShow(id: number, name: string, genres: string[]): TVMazeShow {
  return {
    id,
    name,
    genres,
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

describe('GenreRail', () => {
  it('displays genre metadata and renders items', () => {
    const shows = [createShow(1, 'One', ['Drama']), createShow(2, 'Two', ['Drama'])];
    const wrapper = mount(GenreRail, {
      props: {
        genre: 'Drama',
        shows,
      },
      global: {
        stubs: {
          VirtualHorizontalList: VirtualStub,
          ShowCard: ShowCardStub,
        },
      },
    });

    expect(wrapper.find('.genre-rail__title').text()).toBe('Drama');
    expect(wrapper.find('.genre-rail__meta').text()).toBe('2 shows');
    const renderedItems = wrapper.findAll('.show-card-stub');
    expect(renderedItems).toHaveLength(2);
    expect(renderedItems[0]?.text()).toBe('One');
  });

  it('uses singular subtitle when only one show is provided', () => {
    const wrapper = mount(GenreRail, {
      props: {
        genre: 'Comedy',
        shows: [createShow(3, 'Solo', ['Comedy'])],
      },
      global: {
        stubs: {
          VirtualHorizontalList: VirtualStub,
          ShowCard: ShowCardStub,
        },
      },
    });

    expect(wrapper.find('.genre-rail__meta').text()).toBe('1 show');
  });
});

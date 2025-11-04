/// <reference types="vitest" />

import { describe, it, expect } from 'vitest';
import { mount, shallowMount, type VueWrapper, type Component } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import ShowCastRail from '@/components/ShowCastRail.vue';
import type { TVMazeCastMember } from '@/types/tvmaze';

const virtualListStub = defineComponent({
  name: 'VirtualHorizontalListStub',
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
        (props.items as TVMazeCastMember[]).map((item) =>
          h('div', { class: 'virtual-stub__item' }, slots.default?.({ item }))
        )
      );
  },
});

function mountComponent(overrides: Partial<{ cast: TVMazeCastMember[]; isLoading: boolean; error: string | null }> = {}) {
  const cast: TVMazeCastMember[] = overrides.cast ?? [];
  return mount(ShowCastRail, {
    props: {
      cast,
      isLoading: overrides.isLoading ?? false,
      error: overrides.error ?? null,
    },
    global: {
      stubs: {
        VirtualHorizontalList: virtualListStub,
      },
    },
  });
}

describe('ShowCastRail', () => {
  it('shows fallback message when no cast is provided', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('.show-detail__cast-state').text()).toContain('No cast information available.');
  });

  it('renders cast cards when entries exist', () => {
    const cast: TVMazeCastMember[] = [
      {
        person: { id: 1, name: 'Actor One', image: null },
        character: { id: 11, name: 'Hero', image: null },
        self: false,
        voice: false,
      },
    ];
    const wrapper = mountComponent({ cast });

    const card = wrapper.find('.show-detail__cast-card');
    expect(card.exists()).toBe(true);
    expect(card.text()).toContain('Actor One');
    expect(card.text()).toContain('Hero');
  });
});

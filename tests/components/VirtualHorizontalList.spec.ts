/// <reference types="vitest" />

import { describe, it, expect } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import VirtualHorizontalList from '@/components/VirtualHorizontalList.vue';

describe('VirtualHorizontalList', () => {
  it('computes visible entries and offsets based on scroll position', async () => {
    const items = Array.from({ length: 10 }, (_, index) => `Item ${index}`);

    const wrapper = mount(VirtualHorizontalList, {
      props: {
        items,
        itemWidth: 100,
        itemGap: 20,
        buffer: 1,
      },
      slots: {
        default: ({ item }) => `<span class="cell">${item}</span>`,
      },
    });

    await nextTick();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      viewportWidth: number;
      scrollLeft: number;
      visibleEntries: Array<{ index: number }>;
      startIndex: number;
      spacerStyle: Record<string, string>;
    };

    vm.viewportWidth = 300;
    vm.scrollLeft = 0;
    await nextTick();

    expect(vm.visibleEntries).toHaveLength(5); // ceil(300/120) + buffer*2
    expect(vm.visibleEntries[0]?.index).toBe(0);

    vm.scrollLeft = 240;
    await nextTick();

    expect(vm.startIndex).toBe(1);
    expect(vm.visibleEntries[0]?.index).toBe(1);
    expect(vm.spacerStyle.width).toBe('1180px');
  });
});

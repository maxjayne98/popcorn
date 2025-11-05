/// <reference types="vitest" />

import { describe, it, expect } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import AppHeader from '@/components/AppHeader.vue';

describe('AppHeader', () => {
  it('emits updates when typing and submitting', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        modelValue: '',
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    const input = wrapper.get('input');
    await input.setValue('Lost');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Lost']);

    await wrapper.get('form').trigger('submit.prevent');
    const updates = wrapper.emitted('update:modelValue') ?? [];
    expect(updates[updates.length - 1]).toEqual(['Lost']);
    expect(wrapper.emitted('submit')).toBeTruthy();
  });

  it('disables submit for empty queries and reacts to prop changes', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        modelValue: '',
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    expect(wrapper.get('.app-header__search-button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.search-input__spinner').exists()).toBe(false);

    await wrapper.setProps({ modelValue: 'Severance' });
    expect(wrapper.get('input').element.value).toBe('Severance');
    expect(wrapper.get('.app-header__search-button').attributes('disabled')).toBeUndefined();
  });
});

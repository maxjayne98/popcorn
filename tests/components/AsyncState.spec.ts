/// <reference types="vitest" />

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AsyncState from '@/components/AsyncState.vue';

describe('AsyncState', () => {
  it('renders loading slot when loading', () => {
    const wrapper = mount(AsyncState, {
      props: {
        isLoading: true,
        loadingMessage: 'Fetching data...'
      }
    });

    expect(wrapper.find('.async-state--loading').exists()).toBe(true);
    expect(wrapper.text()).toContain('Fetching data...');
  });

  it('renders provided loading slot content', () => {
    const wrapper = mount(AsyncState, {
      props: {
        isLoading: true
      },
      slots: {
        loading: '<div class="custom-loading">Custom loading</div>'
      }
    });

    expect(wrapper.find('.custom-loading').exists()).toBe(true);
  });

  it('renders error state with prefix', () => {
    const wrapper = mount(AsyncState, {
      props: {
        isLoading: false,
        error: 'Boom',
        errorPrefix: 'Failed:'
      }
    });

    const error = wrapper.find('.async-state--error');
    expect(error.exists()).toBe(true);
    expect(error.text()).toContain('Failed: Boom');
  });

  it('renders error slot when provided', () => {
    const wrapper = mount(AsyncState, {
      props: {
        isLoading: false,
        error: 'Boom'
      },
      slots: {
        error: ({ error }: { error: string }) => `Oops: ${error}`
      }
    });

    expect(wrapper.text()).toContain('Oops: Boom');
  });

  it('renders default slot when idle', () => {
    const wrapper = mount(AsyncState, {
      props: {
        isLoading: false,
        error: null
      },
      slots: {
        default: '<p class="ready">Ready content</p>'
      }
    });

    expect(wrapper.find('.ready').exists()).toBe(true);
    expect(wrapper.find('.async-state--loading').exists()).toBe(false);
    expect(wrapper.find('.async-state--error').exists()).toBe(false);
  });
});

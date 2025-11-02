import { afterEach, vi } from 'vitest';

class ResizeObserverMock implements ResizeObserver {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}

  takeRecords(): ResizeObserverEntry[] {
    return [];
  }
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverMock;
}

if (!('scrollTo' in window)) {
  // jsdom lacks scrollTo; provide a noop for components that call it.
  window.scrollTo = () => {};
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

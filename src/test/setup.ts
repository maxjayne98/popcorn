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

type GlobalWithTestPolyfills = typeof globalThis & {
  ResizeObserver?: typeof ResizeObserver;
  scrollTo?: (options?: ScrollToOptions | number, y?: number) => void;
};

const globalWindow = globalThis as GlobalWithTestPolyfills;

if (!globalWindow.ResizeObserver) {
  globalWindow.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

if (typeof globalWindow.scrollTo !== 'function') {
  // jsdom lacks scrollTo; provide a noop for components that call it.
  globalWindow.scrollTo = () => {};
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

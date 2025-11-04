import { onBeforeUnmount } from 'vue';

type Procedure = (...args: any[]) => any;

type DebouncedFn<T extends Procedure> = {
  run: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: (...args: Parameters<T>) => ReturnType<T>;
  isPending: () => boolean;
};

export function useDebounceFn<T extends Procedure>(fn: T, delay = 300): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const run = (...args: Parameters<T>) => {
    cancel();
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };

  const flush = (...args: Parameters<T>) => {
    cancel();
    return fn(...args);
  };

  const isPending = () => timer !== null;

  onBeforeUnmount(() => {
    cancel();
  });

  return {
    run,
    cancel,
    flush,
    isPending,
  };
}

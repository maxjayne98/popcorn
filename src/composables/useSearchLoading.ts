import type { InjectionKey } from 'vue';
import { inject } from 'vue';

export interface SearchLoadingContext {
  setSearching(value: boolean): void;
}

export const searchLoadingKey: InjectionKey<SearchLoadingContext> = Symbol('search-loading');

export function useSearchLoading() {
  const context = inject(searchLoadingKey);
  if (!context) {
    throw new Error('useSearchLoading must be used within an App provider.');
  }
  return context;
}

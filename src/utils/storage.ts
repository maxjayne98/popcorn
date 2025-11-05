const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function loadArrayFromStorage<T>(key: string, isValid: (value: unknown) => value is T): T[] {
  if (!isBrowser) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValid);
  } catch (error) {
    console.warn(`Failed to read "${key}" from localStorage`, error);
    return [];
  }
}

export function saveArrayToStorage<T>(key: string, items: T[]): void {
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.warn(`Failed to persist "${key}" to localStorage`, error);
  }
}

import type { SearchResult, TVMazeShow } from '@/types/tvmaze';

const API_BASE = 'https://api.tvmaze.com';

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { signal });
  if (!response.ok) {
    throw new Error(`TVMaze request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchShowsPage(page: number, signal?: AbortSignal): Promise<TVMazeShow[]> {
  return request<TVMazeShow[]>(`/shows?page=${page}`, signal);
}

export async function fetchShowById(id: number, signal?: AbortSignal): Promise<TVMazeShow> {
  return request<TVMazeShow>(`/shows/${id}`, signal);
}

export async function searchShowsByName(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  return request<SearchResult[]>(`/search/shows?q=${encodeURIComponent(query)}`, signal);
}

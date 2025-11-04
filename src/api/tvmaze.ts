import axios from 'axios';
import type { SearchResult, TVMazeCastMember, TVMazeShow } from '@/types/tvmaze';

const API_BASE = 'https://api.tvmaze.com';
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: 'application/json',
  },
});

async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  try {
    const { data } = await apiClient.get<T>(path, { signal });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_CANCELED') {
        throw error;
      }
      const status = error.response?.status;
      const message = status ? `TVMaze request failed with status ${status}` : error.message || 'TVMaze request failed.';
      throw new Error(message);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('TVMaze request failed.');
  }
}

export async function fetchShowsPage(page: number, signal?: AbortSignal): Promise<TVMazeShow[]> {
  return apiGet<TVMazeShow[]>(`/shows?page=${page}`, signal);
}

export async function fetchShowById(id: number, signal?: AbortSignal): Promise<TVMazeShow> {
  return apiGet<TVMazeShow>(`/shows/${id}`, signal);
}

export async function searchShowsByName(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  return apiGet<SearchResult[]>(`/search/shows?q=${encodeURIComponent(query)}`, signal);
}

export async function fetchShowCast(id: number, signal?: AbortSignal): Promise<TVMazeCastMember[]> {
  return apiGet<TVMazeCastMember[]>(`/shows/${id}/cast`, signal);
}

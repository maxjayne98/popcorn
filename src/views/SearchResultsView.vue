<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AsyncState from '@/components/AsyncState.vue';
import SearchResultsList from '@/components/SearchResultsList.vue';
import RangeInput from '@/components/RangeInput.vue';
import SearchInput from '@/components/SearchInput.vue';
import { useShowCatalog } from '@/composables/useShowCatalog';
import { useSearchLoading } from '@/composables/useSearchLoading';
import { useSearchCollectionsStore } from '@/stores/searchCollections';
import type { SavedSearch } from '@/stores/searchCollections';
import type { TVMazeShow } from '@/types/tvmaze';
import SaveIcon from '@/components/icons/Save.vue';
import ImdbIcon from '@/components/icons/IMDB.vue';


const route = useRoute();
const router = useRouter();
const { searchShows } = useShowCatalog();
const { setSearching } = useSearchLoading();
const searchCollectionsStore = useSearchCollectionsStore();

const searchResults = ref<TVMazeShow[]>([]);
const lastSearchResults = ref<TVMazeShow[]>([]);
const searchError = ref<string | null>(null);
const isSearching = ref(false);
const searchMinRating = ref(0);
const savedSearchLabel = ref('');

const savedSearches = computed(() => searchCollectionsStore.entries);
const activeQuery = computed(() => {
  const value = route.query.q;
  const query = Array.isArray(value) ? value[0] : value ?? '';
  return query;
});

let activeController: AbortController | null = null;

function normalizeQuery(value: string) {
  return value.trim();
}

async function performSearch(query: string) {
  const normalized = normalizeQuery(query);

  activeController?.abort();
  searchError.value = null;

  if (!normalized) {
    searchResults.value = [];
    lastSearchResults.value = [];
    setSearching(false);
    isSearching.value = false;
    return;
  }

  const controller = new AbortController();
  activeController = controller;
  isSearching.value = true;
  setSearching(true);

  try {
    const results = await searchShows(normalized, controller.signal);
    if (controller.signal.aborted) {
      return;
    }
    const uniqueShows = new Map<number, TVMazeShow>();
    for (const entry of results) {
      uniqueShows.set(entry.show.id, entry.show);
    }
    lastSearchResults.value = [...uniqueShows.values()].sort((a, b) => {
      const ratingA = a.rating?.average ?? 0;
      const ratingB = b.rating?.average ?? 0;
      if (ratingA === ratingB) {
        return a.name.localeCompare(b.name);
      }
      return ratingB - ratingA;
    });
    applySearchFilters();
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }
    searchError.value = error instanceof Error ? error.message : 'Search failed. Please try again.';
  } finally {
    if (!controller.signal.aborted) {
      isSearching.value = false;
      setSearching(false);
      activeController = null;
    }
  }
}

function applySearchFilters() {
  if (!lastSearchResults.value.length) {
    searchResults.value = [];
    return;
  }
  searchResults.value = lastSearchResults.value.filter((show) => {
    const rating = show.rating?.average ?? 0;
    return rating >= searchMinRating.value;
  });
}

function updateRouteQuery(nextQuery: string, minRating = searchMinRating.value) {
  const query = normalizeQuery(nextQuery);
  router
    .push({
      name: 'search-results',
      query: query
        ? {
            q: query,
            ...(minRating ? { minRating: minRating.toString() } : {}),
          }
        : undefined,
    })
    .catch(() => {
      /* ignore redundant navigation */
    });
}

function saveCurrentSearch() {
  const query = normalizeQuery(activeQuery.value);
  searchError.value = null;
  if (!query) {
    searchError.value = 'Enter a search term before saving.';
    return;
  }
  const label = savedSearchLabel.value.trim() || `Search: ${query}`;
  searchCollectionsStore.add(label, query, searchMinRating.value);
  savedSearchLabel.value = '';
}

function applySavedSearch(entry: SavedSearch) {
  searchMinRating.value = entry.minRating;
  applySearchFilters();
  updateRouteQuery(entry.query, entry.minRating);
}

function removeSavedSearch(id: string) {
  searchCollectionsStore.remove(id);
}

watch(
  () => activeQuery.value,
  (query) => {
    performSearch(query);
  },
  { immediate: true }
);

watch(searchMinRating, () => {
  applySearchFilters();
});

watch(
  () => route.query.minRating,
  (value) => {
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (!Number.isNaN(parsed)) {
        searchMinRating.value = parsed;
      }
    } else if (Array.isArray(value) && value.length) {
      const parsed = Number.parseFloat(value[0] ?? '');
      if (!Number.isNaN(parsed)) {
        searchMinRating.value = parsed;
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (!activeQuery.value) {
    setSearching(false);
  }
});

onBeforeUnmount(() => {
  activeController?.abort();
  isSearching.value = false;
  setSearching(false);
});
</script>

<template>
  <div class="search-page">
    <header class="section-header">
      <h1>Search Results</h1>
      <p v-if="activeQuery">
        Showing matches for <strong>"{{ activeQuery }}"</strong>
        <span v-if="isSearching">(searching...)</span>
        <span v-else-if="searchResults.length">({{ searchResults.length }} results)</span>
      </p>
      <p v-else>Enter a search term above and press Search to see matching shows.</p>
    </header>

    <div v-if="activeQuery" class="search-tools">
      <label class="search-tools__rating">
        <span>Minimum IMDB</span>
        <RangeInput
          v-model="searchMinRating"
          :min="0"
          :max="10"
          :step="0.5"
          value-prefix="IMDb "
          :show-value="true"
        />
      </label>
      <div class="search-tools__save">
        <SearchInput
          v-model="savedSearchLabel"
          class="search-tools__save-input"
          type="text"
          placeholder="Label this search"
          aria-label="Saved search label"
          clearable
          @clear="savedSearchLabel = ''"
        />
        <button type="button" class="search-tools__save-button" @click="saveCurrentSearch">
          <SaveIcon aria-hidden="true" />
        </button>
      </div>
    </div>

    <section v-if="savedSearches.length" class="saved-searches">
      <header class="saved-searches__header">
        <h2>Saved Searches</h2>
        <p>Quick shortcuts for your favourite queries.</p>
      </header>
      <ul class="saved-searches__list">
        <li v-for="entry in savedSearches" :key="entry.id">
          <button type="button" @click="applySavedSearch(entry)">
            {{ entry.label }} (min
            <span class="saved-searches__rating">
              <ImdbIcon aria-hidden="true" />
              {{ entry.minRating.toFixed(1) }}
            </span>
            )
          </button>
          <button type="button" class="saved-searches__remove" @click="removeSavedSearch(entry.id)">
            Remove
          </button>
        </li>
      </ul>
    </section>

    <AsyncState
      v-if="activeQuery"
      :is-loading="isSearching"
      :error="searchError"
      loading-message="Searching…"
    >
      <template #error="{ error }">
        <p class="state state--error">{{ error }}</p>
      </template>
      <p v-if="!searchResults.length" class="state">No shows matched your search yet.</p>
      <SearchResultsList v-else :shows="searchResults" />
    </AsyncState>
  </div>
</template>

<style scoped lang="scss">
.search-page {
  display: grid;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  padding-block: clamp(1.5rem, 3vw, 3rem);
}

.section-header h1 {
  margin: 0;
}

.search-tools {
  display: grid;
  gap: 0.75rem;
  align-items: center;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(24, 16, 28, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.search-tools__rating {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.75);
}

.search-tools__rating span {
  font-size: 0.9rem;
  min-width: 7rem;
}

.search-tools__save {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.search-tools__save-input {
  flex: 1;
}

.search-tools__save-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.55rem 1.2rem;
  border-radius: 999px;
  border: 1px solid var(--accent-color, #ff2d55);
  font-weight: 600;
  background: transparent;
  color: var(--dark-900);
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.search-tools__save-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(255, 45, 85, 0.25);
}

.search-tools__save-button:focus-visible {
  outline: 3px solid rgba(255, 45, 85, 0.35);
  outline-offset: 2px;
}

.search-tools__save-button svg {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 640px) {
  .search-tools {
    padding: 0.75rem;
    gap: 0.6rem;
  }

  .search-tools__rating {
    flex-direction: column;
    align-items: stretch;
  }

  .search-tools__rating span {
    min-width: auto;
  }

  .search-tools__save {
    width: 100%;
  }

  .search-tools__save input {
    flex: 1;
  }
}

.saved-searches {
  display: grid;
  gap: 1rem;
}

.saved-searches__list {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.saved-searches__list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.saved-searches__list button {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(24, 15, 34, 0.75);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}

.saved-searches__rating {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: 0.25rem;
}

.saved-searches__rating svg {
  width: 1.2rem;
  height: auto;
}

.saved-searches__list button:hover {
  border-color: rgba(255, 255, 255, 0.35);
}

.saved-searches__remove {
  background: rgba(255, 45, 85, 0.15) !important;
  border-color: rgba(255, 45, 85, 0.35) !important;
}

.state {
  margin: 0;
  color: rgba(255, 255, 255, 0.65);
}

.state--error {
  color: #ff6584;
}

@media (max-width: 640px) {
  .search-tools {
    padding: 0.75rem;
    gap: 0.6rem;
  }

  .search-tools__rating {
    flex-direction: column;
    align-items: stretch;
  }

  .search-tools__rating span {
    min-width: auto;
  }

  .search-tools__save {
    width: 100%;
  }

  .search-tools__save input {
    flex: 1;
  }
}
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { DeepReadonly } from 'vue';
import { useRouter } from 'vue-router';
import CustomSelect from '@/components/CustomSelect.vue';
import GenreRail from '@/components/GenreRail.vue';
import SearchResultsList from '@/components/SearchResultsList.vue';
import ShowCard from '@/components/ShowCard.vue';
import { useShowCatalog } from '@/composables/useShowCatalog';
import { useSearchLoading } from '@/composables/useSearchLoading';
import { useParallaxBackground } from '@/composables/useParallaxBackground';
import { useDebounceFn } from '@/composables/useDebounce';
import { useWatchlistStore } from '@/stores/watchlist';
import { useRecentlyViewedStore } from '@/stores/recentlyViewed';
import { useSearchCollectionsStore } from '@/stores/searchCollections';
import type { SavedSearch } from '@/stores/searchCollections';
import type { TVMazeShow } from '@/types/tvmaze';

const props = defineProps<{
  searchQuery: string;
}>();

const emit = defineEmits<{
  (e: 'update-search', value: string): void;
}>();

const router = useRouter();
const { loadShows, genreCollections, isLoading, error, searchShows, allShows } = useShowCatalog();
const { setSearching } = useSearchLoading();
const watchlistStore = useWatchlistStore();
const recentlyViewedStore = useRecentlyViewedStore();
const searchCollectionsStore = useSearchCollectionsStore();

const searchResults = ref<TVMazeShow[]>([]);
const searchError = ref<string | null>(null);
const isSearching = ref(false);
let activeController: AbortController | null = null;
let hasRunInitialSearch = false;
const SEARCH_DEBOUNCE_MS = 700;

type RuntimeFilter = 'all' | 'short' | 'medium' | 'long';
type SelectOption = {
  value: string;
  label: string;
};
const runtimeFilter = ref<RuntimeFilter>('all');
const languageFilter = ref('all');
const networkFilter = ref('all');

const searchMinRating = ref(0);
const savedSearchLabel = ref('');
const lastSearchResults = ref<TVMazeShow[]>([]);

const featuredShow = ref<TVMazeShow | null>(null);
const topWatchShows = ref<TVMazeShow[]>([]);
const watchlistShows = computed(() => {
  if (!watchlistStore.pinnedIds.length) {
    return [] as TVMazeShow[];
  }
  const lookup = new Map(allShows.value.map((show) => [show.id, show]));
  return watchlistStore.pinnedIds
    .map((id) => lookup.get(id))
    .filter((show): show is TVMazeShow => !!show);
});

const recentlyViewedShows = computed(() => recentlyViewedStore.items);
const savedSearches = computed(() => searchCollectionsStore.entries);


const runtimeOptions: SelectOption[] = [
  { value: 'all', label: 'Any runtime' },
  { value: 'short', label: '< 30 min' },
  { value: 'medium', label: '30-60 min' },
  { value: 'long', label: '> 60 min' },
];

const languageOptions = computed<SelectOption[]>(() => {
  const set = new Set<string>();
  for (const show of allShows.value) {
    if (show.language) {
      set.add(show.language);
    }
  }
  const languages = Array.from(set).sort((a, b) => a.localeCompare(b));
  return [
    { value: 'all', label: 'Any language' },
    ...languages.map((language) => ({ value: language, label: language })),
  ];
});

const networkOptions = computed<SelectOption[]>(() => {
  const set = new Set<string>();
  for (const show of allShows.value) {
    if (show.network?.name) {
      set.add(show.network.name);
    }
  }
  const networks = Array.from(set).sort((a, b) => a.localeCompare(b));
  return [
    { value: 'all', label: 'Any network' },
    ...networks.map((network) => ({ value: network, label: network })),
  ];
});

function matchesFilters(show: TVMazeShow) {
  const runtime = show.runtime ?? 0;
  if (runtimeFilter.value === 'short' && runtime >= 30) {
    return false;
  }
  if (runtimeFilter.value === 'medium' && (runtime < 30 || runtime > 60)) {
    return false;
  }
  if (runtimeFilter.value === 'long' && runtime <= 60) {
    return false;
  }

  if (languageFilter.value !== 'all' && show.language !== languageFilter.value) {
    return false;
  }

  if (networkFilter.value !== 'all') {
    const networkName = show.network?.name ?? '';
    if (networkName !== networkFilter.value) {
      return false;
    }
  }

  return true;
}

const filteredTopWatchShows = computed(() => topWatchShows.value.filter(matchesFilters));

const filteredGenreCollections = computed(() =>
  genreCollections.value
    .map((collection) => ({
      genre: collection.genre,
      shows: collection.shows.filter(matchesFilters),
    }))
    .filter((collection) => collection.shows.length)
);

const heroGenreChips = computed(() => {
  const set = new Set<string>();
  for (const show of filteredTopWatchShows.value) {
    for (const genre of show.genres) {
      set.add(genre);
      if (set.size >= 6) {
        break;
      }
    }
    if (set.size >= 6) {
      break;
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
});

const isShowingResults = computed(() => !!props.searchQuery.trim());

const heroSubtitle = computed(() => {
  if (!genreCollections.value.length) {
    return 'Fetching curated TV shows by genre...';
  }
  const totalShows = genreCollections.value.reduce((total, genre) => total + genre.shows.length, 0);
  return `Browsing ${totalShows} shows across ${genreCollections.value.length} genres.`;
});

const {
  parallaxStyle: heroParallaxStyle,
  onMouseEnter: handleHeroMouseEnter,
  onMouseLeave: handleHeroMouseLeave,
  onMouseMove: handleHeroMouseMove,
} = useParallaxBackground({ range: 32 });

const featuredBackdropStyle = computed(() => {
  const baseStyle = { ...heroParallaxStyle.value };
  if (!featuredShow.value) {
    return baseStyle;
  }
  const image = featuredShow.value.image?.original ?? featuredShow.value.image?.medium;
  if (image) {
    baseStyle.backgroundImage = `linear-gradient(135deg, rgba(8, 9, 15, 0.9) 10%, rgba(8, 9, 15, 0.15) 70%), url('${image}')`;
  }
  return baseStyle;
});

const featuredSummary = computed(() => {
  if (!featuredShow.value?.summary) {
    return '';
  }
  return featuredShow.value.summary.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
});

async function ensureShowsLoaded() {
  await loadShows();
}

function shuffle<T>(items: readonly T[]): T[] {
  const buffer = [...items];
  for (let i = buffer.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = buffer[i]!;
    const jValue = buffer[j]!;
    buffer[i] = jValue;
    buffer[j] = temp;
  }
  return buffer;
}

function deriveFeaturedSelection(shows: readonly DeepReadonly<TVMazeShow>[]) {
  const showsList = shows.map((show) => ({
    ...show,
    genres: [...show.genres],
  })) as TVMazeShow[];
  if (!showsList.length) {
    featuredShow.value = null;
    topWatchShows.value = [];
    return;
  }

  const withArt = showsList
    .filter((show) => show.image?.original || show.image?.medium)
    .sort((a, b) => {
      const ratingA = a.rating?.average ?? 0;
      const ratingB = b.rating?.average ?? 0;
      if (ratingA === ratingB) {
        return a.name.localeCompare(b.name);
      }
      return ratingB - ratingA;
    });

  if (!withArt.length) {
    featuredShow.value = showsList[0]!;
    topWatchShows.value = [];
    return;
  }

  const featurePool = withArt.slice(0, Math.min(12, withArt.length));
  const pool = featurePool.length ? featurePool : withArt;
  let selected = pool[Math.floor(Math.random() * pool.length)];
  if (!selected) {
    selected = withArt[0]!;
  }
  featuredShow.value = selected as TVMazeShow;

  const topPool = withArt.filter((show) => show.id !== featuredShow.value?.id).slice(0, 30);
  topWatchShows.value = shuffle(topPool).slice(0, 6);
}

async function performSearch(query: string) {
  const normalized = query.trim();

  activeController?.abort();
  searchError.value = null;

  if (!normalized) {
    searchResults.value = [];
    lastSearchResults.value = [];
    setSearching(false);
    isSearching.value = false;
    emit('update-search', '');
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
  } catch (err) {
    if (controller.signal.aborted) {
      return;
    }
    searchError.value = err instanceof Error ? err.message : 'Search failed. Please try again.';
  } finally {
    if (!controller.signal.aborted) {
      isSearching.value = false;
      setSearching(false);
      activeController = null;
    }
  }
}

const { run: runDebouncedSearch, cancel: cancelDebouncedSearch } = useDebounceFn(
  performSearch,
  SEARCH_DEBOUNCE_MS
);

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

watch(
  () => props.searchQuery,
  (query) => {
    cancelDebouncedSearch();
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
    const normalizedQuery = query.trim();
    const isFirstRun = !hasRunInitialSearch;
    const shouldRunImmediately = isFirstRun || !normalizedQuery;

    if (isFirstRun) {
      hasRunInitialSearch = true;
    }

    if (shouldRunImmediately) {
      performSearch(query);
      return;
    }
    runDebouncedSearch(query);
  },
  { immediate: true }
);

watch(searchMinRating, () => {
  applySearchFilters();
});

onMounted(() => {
  ensureShowsLoaded();
});

onBeforeUnmount(() => {
  activeController?.abort();
  cancelDebouncedSearch();
});

watch(
  () => allShows.value,
  (shows) => {
    if (!shows.length) {
      return;
    }
    if (featuredShow.value && topWatchShows.value.length) {
      return;
    }
    deriveFeaturedSelection(shows);
  },
  { immediate: true }
);

function handleHeroPlay() {
  if (!featuredShow.value) {
    return;
  }
  const destination = featuredShow.value.officialSite ?? featuredShow.value.url;
  if (destination && typeof window !== 'undefined') {
    window.open(destination, '_blank', 'noopener');
  } else {
    router.push({ name: 'show-details', params: { id: featuredShow.value.id } });
  }
}

function handleHeroMoreInfo() {
  if (!featuredShow.value) {
    return;
  }
  router.push({ name: 'show-details', params: { id: featuredShow.value.id } });
}

function focusHeroByGenre(genre: string) {
  const candidate = topWatchShows.value.find((show) => show.genres.includes(genre));
  if (candidate) {
    featuredShow.value = candidate;
  }
}

function saveCurrentSearch() {
  const query = props.searchQuery.trim();
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
  emit('update-search', entry.query);
}

function removeSavedSearch(id: string) {
  searchCollectionsStore.remove(id);
}
</script>

<template>
  <div class="page-container">
    <section v-if="featuredShow" class="hero" :style="featuredBackdropStyle">
      <div
        class="hero__overlay"
        @mousemove="handleHeroMouseMove"
        @mouseleave="handleHeroMouseLeave"
        @mouseenter="handleHeroMouseEnter"
      >
        <div class="hero__content">
          <p class="hero__eyebrow">Featured Spotlight</p>
          <h1>{{ featuredShow.name }}</h1>
          <p v-if="featuredSummary" class="hero__summary">{{ featuredSummary }}</p>
          <ul class="hero__meta">
            <li v-if="featuredShow.genres.length">{{ featuredShow.genres.join(' • ') }}</li>
            <li v-if="featuredShow.rating?.average">⭐ {{ featuredShow.rating.average.toFixed(1) }}</li>
            <li v-if="featuredShow.runtime">{{ featuredShow.runtime }} min</li>
          </ul>
          <div class="hero__actions">
            <button type="button" class="hero__button hero__button--primary" @click="handleHeroPlay">
              ▶ Play
            </button>
            <button type="button" class="hero__button" @click="handleHeroMoreInfo">
              ℹ More Info
            </button>
          </div>
          <p class="hero__subtitle">{{ heroSubtitle }}</p>
          <div v-if="heroGenreChips.length" class="hero__chips">
            <button
              v-for="chip in heroGenreChips"
              :key="chip"
              type="button"
              class="hero__chip"
              @click="focusHeroByGenre(chip)"
            >
              {{ chip }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="topWatchShows.length" class="page-section top-watch">
      <header class="section-header">
        <h2>Top Picks For You</h2>
        <p>Curated from the highest-rated shows right now.</p>
      </header>
      <div class="top-watch__filters">
        <label>
          <span>Runtime</span>
          <CustomSelect v-model="runtimeFilter" :options="runtimeOptions" />
        </label>
        <label>
          <span>Language</span>
          <CustomSelect v-model="languageFilter" :options="languageOptions" />
        </label>
        <label>
          <span>Network</span>
          <CustomSelect v-model="networkFilter" :options="networkOptions" />
        </label>
      </div>
      <p v-if="!filteredTopWatchShows.length" class="state">No picks match the selected filters yet.</p>
      <div v-else class="card-rail top-watch__rail" role="list">
        <div
          v-for="show in filteredTopWatchShows"
          :key="show.id"
          role="listitem"
          class="card-rail__item top-watch__item"
        >
          <ShowCard :show="show" />
        </div>
      </div>
    </section>

    <section v-if="savedSearches.length" class="page-section saved-searches">
      <header class="section-header">
        <h2>Saved Searches</h2>
        <p>Quick shortcuts for your favourite queries.</p>
      </header>
      <ul class="saved-searches__list">
        <li v-for="entry in savedSearches" :key="entry.id">
          <button type="button" @click="applySavedSearch(entry)">
            {{ entry.label }} (min ⭐ {{ entry.minRating.toFixed(1) }})
          </button>
          <button type="button" class="saved-searches__remove" @click="removeSavedSearch(entry.id)">
            Remove
          </button>
        </li>
      </ul>
    </section>

    <section v-if="recentlyViewedShows.length" class="page-section recently-viewed">
      <header class="section-header">
        <h2>Continue Browsing</h2>
        <p>Jump back into shows you viewed recently.</p>
      </header>
      <div class="card-rail" role="list">
        <div
          v-for="show in recentlyViewedShows"
          :key="show.id"
          role="listitem"
          class="card-rail__item"
        >
          <div class="recent-card">
            <ShowCard :show="show" />
            <button
              type="button"
              class="recent-card__remove"
              @click="recentlyViewedStore.remove(show.id)"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="watchlistShows.length" class="page-section watchlist">
      <header class="section-header">
        <h2>Your Watchlist</h2>
        <p>Shows you pinned for later.</p>
      </header>
      <div class="card-rail" role="list">
        <div
          v-for="show in watchlistShows"
          :key="show.id"
          role="listitem"
          class="card-rail__item"
        >
          <ShowCard :show="show" />
        </div>
      </div>
    </section>

    <section v-if="isShowingResults" class="page-section">
      <header class="section-header">
        <h2>Search Results</h2>
        <p>
          Showing matches for <strong>"{{ searchQuery }}"</strong>
          <span v-if="isSearching">(searching...)</span>
          <span v-else-if="searchResults.length">({{ searchResults.length }} results)</span>
        </p>
      </header>
      <div class="search-tools">
        <label class="search-tools__rating">
          <span>Minimum rating</span>
          <input type="range" min="0" max="10" step="0.5" v-model.number="searchMinRating" />
          <span class="search-tools__value">⭐ {{ searchMinRating.toFixed(1) }}</span>
        </label>
        <div class="search-tools__save">
          <input
            v-model="savedSearchLabel"
            type="text"
            placeholder="Label this search"
            aria-label="Saved search label"
          />
          <button type="button" @click="saveCurrentSearch">Save Search</button>
        </div>
      </div>
      <p v-if="searchError" class="state state--error">
        {{ searchError }}
      </p>
      <p v-else-if="!searchResults.length && !isSearching" class="state">
        No shows matched your search yet.
      </p>
      <SearchResultsList v-else :shows="searchResults" />
    </section>

    <section v-else class="page-section">
      <p v-if="error" class="state state--error">
        Unable to load shows right now. {{ error }}
      </p>
      <div v-else-if="isLoading && !genreCollections.length" class="state">Loading shows...</div>
      <template v-else>
        <div class="genre-grid">
          <GenreRail
          v-for="collection in filteredGenreCollections"
          :key="collection.genre"
          :genre="collection.genre"
          :shows="collection.shows"
        />
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped lang="scss">
.page-section {
  display: grid;
  gap: 1.5rem;
}

.hero {
  position: relative;
  min-height: clamp(320px, 55vh, 520px);
  border-radius: 1.5rem;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(26, 4, 8, 0.88), rgba(8, 1, 3, 0.4));
  background-size: cover, cover;
  background-position:
    calc(50% + var(--parallax-shift-x, 0px)) calc(50% + var(--parallax-shift-y, 0px)),
    calc(50% + var(--parallax-shift-x, 0px)) calc(50% + var(--parallax-shift-y, 0px));
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
  transition: background-position 180ms ease;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(30, 4, 8, 0.9) 15%, rgba(20, 3, 6, 0.55) 50%, rgba(0, 0, 0, 0));
  display: flex;
  align-items: flex-end;
  padding: clamp(1.5rem, 4vw, 3rem);
}

.hero__content {
  max-width: min(640px, 90%);
  display: grid;
  gap: 1rem;
  color: white;
}

.hero__eyebrow {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.hero__content h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.1;
}

.hero__summary {
  margin: 0;
  font-size: clamp(1rem, 1.8vw, 1.15rem);
  color: rgba(255, 255, 255, 0.82);
  text-wrap: balance;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
  color: rgba(255, 190, 203, 0.78);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero__button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(26, 4, 8, 0.75);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
}

.hero__button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
}

.hero__button--primary {
  background: white;
  color: var(--dark-900);
  border-color: white;
}

.hero__button--primary:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.hero__subtitle {
  margin: 0;
  color: rgba(255, 190, 203, 0.72);
  font-size: 0.95rem;
}

.hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.hero__chip {
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(18, 8, 26, 0.65);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
}

.hero__chip:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(32, 18, 46, 0.75);
}

.top-watch__rail {
  padding-bottom: 0.75rem;
}

.top-watch__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.top-watch__filters label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);
}

.recent-card {
  position: relative;
  display: grid;
}

.recent-card__remove {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  z-index: 2;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(16, 8, 24, 0.75);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
}

.recent-card__remove:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(30, 16, 44, 0.85);
}

.search-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.search-tools__rating {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.75);
}

.search-tools__rating input[type='range'] {
  accent-color: var(--accent-color, #ff2d55);
}

.search-tools__value {
  font-weight: 600;
  color: rgba(255, 215, 0, 0.9);
}

.search-tools__save {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.search-tools__save input {
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(20, 12, 28, 0.75);
  color: rgba(255, 255, 255, 0.85);
}

.search-tools__save button {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(26, 6, 22, 0.85);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: transform 150ms ease, border-color 150ms ease;
}

.search-tools__save button:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.45);
}

.saved-searches__list {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.saved-searches__list li {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.saved-searches__list button {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(18, 10, 26, 0.75);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  cursor: pointer;
}

.saved-searches__remove {
  background: rgba(255, 55, 95, 0.18) !important;
  border-color: rgba(255, 55, 95, 0.4) !important;
  color: rgba(255, 175, 185, 0.9) !important;
}

.top-watch__item {
  text-decoration: none;
  color: inherit;
}

.section-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  align-items: baseline;
}

.section-header h2 {
  margin: 0;
  font-size: clamp(1.4rem, 2vw, 1.8rem);
}

.section-header p {
  margin: 0;
  color: var(--text-secondary);
}

.state {
  margin: 0;
  padding: 1.5rem;
  text-align: center;
  background: var(--surface-color);
  border-radius: 1rem;
}

.top-watch .section-header p {
  color: rgba(255, 255, 255, 0.65);
}

.state--error {
  border: 1px solid rgba(255, 95, 109, 0.45);
  color: #ff9aa2;
}

.genre-grid {
  display: grid;
  gap: clamp(1.5rem, 2vw, 2.5rem);
}

@media (max-width: 720px) {
  .state {
    font-size: 0.95rem;
  }
}
</style>

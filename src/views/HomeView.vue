<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { DeepReadonly } from 'vue';
import GenreRail from '@/components/GenreRail.vue';
import AsyncState from '@/components/AsyncState.vue';
import FeaturedHero from '@/components/FeaturedHero.vue';
import TopPicksSection from '@/components/TopPicksSection.vue';
import SavedSearchesSection from '@/components/SavedSearchesSection.vue';
import RecentlyViewedSection from '@/components/RecentlyViewedSection.vue';
import WatchlistSection from '@/components/WatchlistSection.vue';
import { useShowCatalog } from '@/composables/useShowCatalog';
import { useWatchlistStore } from '@/stores/watchlist';
import { useRecentlyViewedStore } from '@/stores/recentlyViewed';
import { useSearchCollectionsStore } from '@/stores/searchCollections';
import type { TVMazeShow } from '@/types/tvmaze';

type RuntimeFilter = 'all' | 'short' | 'medium' | 'long';

const { loadShows, genreCollections, isLoading, error, allShows } = useShowCatalog();
const watchlistStore = useWatchlistStore();
const recentlyViewedStore = useRecentlyViewedStore();
const searchCollectionsStore = useSearchCollectionsStore();

const runtimeFilter = ref<RuntimeFilter>('all');
const languageFilter = ref('all');
const networkFilter = ref('all');

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
  for (const show of topWatchShows.value) {
    for (const genre of show.genres) {
      set.add(genre);
      if (set.size >= 3) {
        break;
      }
    }
    if (set.size >= 3) {
      break;
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 3);
});

const heroSubtitle = computed(() => {
  if (!genreCollections.value.length) {
    return 'Fetching curated TV shows by genre...';
  }
  const totalShows = genreCollections.value.reduce((total, genre) => total + genre.shows.length, 0);
  return `Browsing ${totalShows} shows across ${genreCollections.value.length} genres.`;
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

onMounted(() => {
  ensureShowsLoaded();
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

function focusHeroByGenre(genre: string) {
  const candidate = topWatchShows.value.find((show) => show.genres.includes(genre));
  if (candidate) {
    featuredShow.value = candidate;
  }
}

function removeSavedSearch(id: string) {
  searchCollectionsStore.remove(id);
}
</script>

<template>
  <div class="page-container">
    <FeaturedHero
      v-if="featuredShow"
      :show="featuredShow"
      :subtitle="heroSubtitle"
      :genre-chips="heroGenreChips"
      @focus-by-genre="focusHeroByGenre"
    />

    <TopPicksSection
      :shows="topWatchShows"
      :all-shows="allShows"
      v-model:runtime-filter="runtimeFilter"
      v-model:language-filter="languageFilter"
      v-model:network-filter="networkFilter"
    />

    <SavedSearchesSection :searches="savedSearches" @remove="removeSavedSearch" />

    <RecentlyViewedSection
      :shows="recentlyViewedShows"
      @remove="recentlyViewedStore.remove"
    />

    <WatchlistSection :shows="watchlistShows" />

    <section class="page-section">
      <AsyncState
        :is-loading="isLoading && !genreCollections.length"
        :error="error"
        loading-message="Loading shows..."
        error-prefix="Unable to load shows right now."
      >
        <div class="genre-grid">
          <GenreRail
            v-for="collection in filteredGenreCollections"
            :key="collection.genre"
            :genre="collection.genre"
            :shows="collection.shows"
          />
        </div>
      </AsyncState>
    </section>
  </div>
</template>

<style scoped lang="scss">
.page-section {
  display: grid;
  gap: 1.5rem;
}

.genre-grid {
  display: grid;
  gap: clamp(1.5rem, 2vw, 2.5rem);
}
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { DeepReadonly } from 'vue';
import { useRouter } from 'vue-router';
import GenreRail from '@/components/GenreRail.vue';
import SearchResultsList from '@/components/SearchResultsList.vue';
import ShowCard from '@/components/ShowCard.vue';
import { useShowCatalog } from '@/composables/useShowCatalog';
import { useSearchLoading } from '@/composables/useSearchLoading';
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

const searchResults = ref<TVMazeShow[]>([]);
const searchError = ref<string | null>(null);
const isSearching = ref(false);
let activeController: AbortController | null = null;

const featuredShow = ref<TVMazeShow | null>(null);
const topWatchShows = ref<TVMazeShow[]>([]);

const isShowingResults = computed(() => !!props.searchQuery.trim());

const heroSubtitle = computed(() => {
  if (!genreCollections.value.length) {
    return 'Fetching curated TV shows by genre...';
  }
  const totalShows = genreCollections.value.reduce((total, genre) => total + genre.shows.length, 0);
  return `Browsing ${totalShows} shows across ${genreCollections.value.length} genres.`;
});

const featuredBackdropStyle = computed(() => {
  if (!featuredShow.value) {
    return {};
  }
  const image = featuredShow.value.image?.original ?? featuredShow.value.image?.medium;
  return image
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(8, 9, 15, 0.9) 10%, rgba(8, 9, 15, 0.15) 70%), url('${image}')`,
      }
    : {};
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
    searchResults.value = [...uniqueShows.values()].sort((a, b) => {
      const ratingA = a.rating?.average ?? 0;
      const ratingB = b.rating?.average ?? 0;
      if (ratingA === ratingB) {
        return a.name.localeCompare(b.name);
      }
      return ratingB - ratingA;
    });
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

watch(
  () => props.searchQuery,
  (query) => {
    performSearch(query);
  },
  { immediate: true }
);

onMounted(() => {
  ensureShowsLoaded();
});

onBeforeUnmount(() => {
  activeController?.abort();
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
</script>

<template>
  <div class="page-container">
    <section v-if="featuredShow" class="hero" :style="featuredBackdropStyle">
      <div class="hero__overlay">
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
        </div>
      </div>
    </section>

    <section v-if="topWatchShows.length" class="page-section top-watch">
      <header class="section-header">
        <h2>Top Picks For You</h2>
        <p>Curated from the highest-rated shows right now.</p>
      </header>
      <div class="card-rail top-watch__rail" role="list">
        <div
          v-for="show in topWatchShows"
          :key="show.id"
          role="listitem"
          class="card-rail__item top-watch__item"
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
            v-for="collection in genreCollections"
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
  background-size: cover;
  background-position: center;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
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

.top-watch__rail {
  padding-bottom: 0.75rem;
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

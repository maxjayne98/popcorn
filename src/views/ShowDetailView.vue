<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useShowCatalog } from '@/composables/useShowCatalog';
import { useRecentlyViewedStore } from '@/stores/recentlyViewed';
import type { TVMazeShow } from '@/types/tvmaze';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const { ensureShow } = useShowCatalog();
const recentlyViewed = useRecentlyViewedStore();

const show = ref<TVMazeShow | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const poster = computed(() => show.value?.image?.original ?? show.value?.image?.medium ?? '');
const averageRating = computed(() => show.value?.rating?.average ?? null);

const formattedSchedule = computed(() => {
  if (!show.value) {
    return '';
  }
  const { schedule } = show.value;
  if (!schedule?.days?.length) {
    return schedule?.time ? `Daily at ${schedule.time}` : 'Schedule unavailable';
  }
  return `${schedule.days.join(', ')}${schedule.time ? ` at ${schedule.time}` : ''}`;
});

const networks = computed(() => {
  if (!show.value?.network?.name) {
    return '';
  }
  const country = show.value.network.country?.name;
  return country ? `${show.value.network.name} (${country})` : show.value.network.name;
});

async function loadShowDetails(identifier: string) {
  const numericId = Number.parseInt(identifier, 10);
  if (Number.isNaN(numericId)) {
    error.value = 'Invalid show identifier.';
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = null;
  const result = await ensureShow(numericId);
  if (!result) {
    error.value = 'Show not found. It may have been removed.';
    show.value = null;
  } else {
    show.value = result;
    recentlyViewed.add(result);
  }
  isLoading.value = false;
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: 'home' });
  }
}

watch(
  () => props.id,
  (identifier) => {
    loadShowDetails(identifier);
  },
  { immediate: true }
);
</script>

<template>
  <div class="page-container">
    <button class="back-button" type="button" @click="goBack">← Back</button>
    <section v-if="isLoading" class="state">Loading show details...</section>
    <section v-else-if="error" class="state state--error">
      {{ error }}
    </section>
    <article v-else-if="show" class="show-detail">
      <div class="show-detail__poster">
        <img v-if="poster" :alt="`${show.name} poster`" :src="poster" loading="lazy" />
        <div v-else class="show-detail__poster-placeholder">
          <span>{{ show.name.charAt(0).toUpperCase() }}</span>
        </div>
        <span v-if="averageRating" class="show-detail__badge">
          ⭐ {{ averageRating.toFixed(1) }}
        </span>
      </div>
      <div class="show-detail__content">
        <header>
          <h1>{{ show.name }}</h1>
          <p class="show-detail__tags">
            <span v-if="show.status">{{ show.status }}</span>
            <span v-if="show.premiered">Premiered {{ new Date(show.premiered).getFullYear() }}</span>
            <span v-if="show.ended">Ended {{ new Date(show.ended).getFullYear() }}</span>
          </p>
        </header>
        <div v-if="show.summary" class="show-detail__summary" v-html="show.summary" />
        <dl class="show-detail__meta">
          <div v-if="show.genres.length">
            <dt>Genres</dt>
            <dd>{{ show.genres.join(', ') }}</dd>
          </div>
          <div v-if="formattedSchedule">
            <dt>Schedule</dt>
            <dd>{{ formattedSchedule }}</dd>
          </div>
          <div v-if="show.language">
            <dt>Language</dt>
            <dd>{{ show.language }}</dd>
          </div>
          <div v-if="show.runtime">
            <dt>Runtime</dt>
            <dd>{{ show.runtime }} min</dd>
          </div>
          <div v-if="networks">
            <dt>Networks</dt>
            <dd>{{ networks }}</dd>
          </div>
        </dl>
        <div class="show-detail__links">
          <a v-if="show.url" :href="show.url" target="_blank" rel="noopener">View on TVMaze</a>
          <a v-if="show.officialSite" :href="show.officialSite" target="_blank" rel="noopener">
            Official Site
          </a>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped lang="scss">
.back-button {
  justify-self: start;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease;
}

.back-button:hover {
  border-color: rgba(255, 45, 85, 0.6);
  color: rgba(255, 144, 164, 0.9);
}

.state {
  margin: 0;
  padding: 2rem;
  text-align: center;
  background: var(--surface-color);
  border-radius: 1rem;
}

.state--error {
  border: 1px solid rgba(255, 95, 109, 0.45);
  color: #ff9aa2;
}

.show-detail {
  display: grid;
  grid-template-columns: minmax(240px, 320px) 1fr;
  gap: clamp(2rem, 3vw, 3rem);
  padding: clamp(1.5rem, 2.5vw, 2.5rem);
  background: var(--surface-elevated);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.show-detail__poster {
  position: relative;
  border-radius: 1.25rem;
  overflow: hidden;
  aspect-ratio: 2 / 3;
  background: linear-gradient(145deg, rgba(34, 36, 52, 0.9), rgba(18, 20, 31, 0.9));
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.show-detail__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.show-detail__poster-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 4rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.35);
}

.show-detail__badge {
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.65);
  color: #ffdd57;
  font-weight: 600;
}

.show-detail__content {
  display: grid;
  gap: 1.25rem;
}

.show-detail__content h1 {
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  line-height: 1.2;
}

.show-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0 0;
  color: var(--text-secondary);
}

.show-detail__tags span {
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.show-detail__summary :deep(p) {
  margin: 0 0 0.75rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.show-detail__meta {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.show-detail__meta div {
  display: grid;
  gap: 0.15rem;
}

.show-detail__meta dt {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.show-detail__meta dd {
  margin: 0;
  color: var(--text-secondary);
}

.show-detail__links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.show-detail__links a {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: var(--accent-gradient);
  color: var(--dark-900);
  font-weight: 600;
  transition: transform 150ms ease;
}

.show-detail__links a:hover {
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .show-detail {
    grid-template-columns: 1fr;
  }

  .show-detail__poster {
    justify-self: center;
    width: min(320px, 80%);
  }
}
</style>

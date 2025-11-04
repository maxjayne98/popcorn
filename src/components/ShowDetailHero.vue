<script setup lang="ts">
import { computed } from 'vue';
import type { TVMazeShow } from '@/types/tvmaze';

const props = defineProps<{
  show: TVMazeShow;
  poster: string;
  averageRating: number | null;
  formattedSchedule: string;
  networks: string;
  premieredYear: string;
  endedYear: string;
}>();

const initial = computed(() => props.show.name.charAt(0).toUpperCase());
</script>

<template>
  <div class="show-detail__hero">
    <div class="show-detail__poster">
      <img v-if="poster" :alt="`${show.name} poster`" :src="poster" loading="lazy" />
      <div v-else class="show-detail__poster-placeholder">
        <span>{{ initial }}</span>
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
          <span v-if="premieredYear">Premiered {{ premieredYear }}</span>
          <span v-if="endedYear">Ended {{ endedYear }}</span>
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
  </div>
</template>

<style scoped lang="scss">
.show-detail__hero {
  display: grid;
  grid-template-columns: minmax(240px, 320px) 1fr;
  gap: clamp(2rem, 3vw, 3rem);
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
  .show-detail__hero {
    grid-template-columns: 1fr;
  }

  .show-detail__poster {
    max-width: 320px;
  }
}
</style>

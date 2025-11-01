<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { TVMazeShow } from '@/types/tvmaze';

const props = defineProps<{
  show: TVMazeShow;
}>();

const imageSrc = computed(() => props.show.image?.medium ?? props.show.image?.original ?? '');
const averageRating = computed(() => props.show.rating?.average ?? null);
const premiereYear = computed(() => (props.show.premiered ? new Date(props.show.premiered).getFullYear() : null));
const networkLabel = computed(() => props.show.network?.name ?? props.show.language ?? 'Uncategorized');
</script>

<template>
  <RouterLink
    :to="{ name: 'show-details', params: { id: show.id } }"
    class="show-card"
    :aria-label="`View details for ${show.name}`"
  >
    <div class="show-card__poster">
      <img v-if="imageSrc" :alt="`${show.name} poster`" :src="imageSrc" loading="lazy" />
      <div v-else class="show-card__poster-placeholder" aria-hidden="true">
        <span>{{ show.name.charAt(0).toUpperCase() }}</span>
      </div>
      <span v-if="averageRating" class="show-card__badge">
        ⭐ {{ averageRating.toFixed(1) }}
      </span>
    </div>
    <div class="show-card__body">
      <h3 class="show-card__title">{{ show.name }}</h3>
      <p class="show-card__meta">
        <span>{{ networkLabel }}</span>
        <span v-if="premiereYear">• {{ premiereYear }}</span>
      </p>
      <ul v-if="show.genres.length" class="show-card__genres">
        <li v-for="genre in show.genres" :key="genre">{{ genre }}</li>
      </ul>
    </div>
  </RouterLink>
</template>

<style scoped lang="scss">
.show-card {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  width: 200px;
  min-width: 200px;
  border-radius: 1rem;
  overflow: hidden;
  background: rgba(38, 8, 14, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.show-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 45, 85, 0.45);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
}

.show-card__poster {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(68, 12, 20, 0.9), rgba(32, 6, 12, 0.92));
}

.show-card__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.show-card__poster-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 3rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.35);
}

.show-card__badge {
  position: absolute;
  left: 0.75rem;
  bottom: 0.75rem;
  padding: 0.35rem 0.6rem;
  background: rgba(0, 0, 0, 0.75);
  color: #ffdd57;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.show-card__body {
  display: grid;
  gap: 0.5rem;
  padding: 0.85rem 1rem 1rem;
}

.show-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  text-wrap: balance;
}

.show-card__meta {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
}

.show-card__genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.show-card__genres li {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
  background: rgba(255, 45, 85, 0.18);
  color: rgba(255, 135, 155, 0.92);
}

@media (max-width: 480px) {
  .show-card {
    width: 168px;
    min-width: 168px;
  }

  .show-card__title {
    font-size: 0.95rem;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { TVMazeShow } from '@/types/tvmaze';

const props = defineProps<{
  show: TVMazeShow;
}>();

const poster = computed(() => props.show.image?.medium ?? props.show.image?.original ?? '');
const rating = computed(() => props.show.rating?.average ?? null);

const summaryText = computed(() =>
  props.show.summary
    ? props.show.summary.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    : ''
);
</script>

<template>
  <RouterLink
    :to="{ name: 'show-details', params: { id: show.id } }"
    class="show-list-item"
    :aria-label="`View details for ${show.name}`"
  >
    <div class="show-list-item__poster">
      <img v-if="poster" :src="poster" :alt="`${show.name} poster`" loading="lazy" />
      <div v-else class="show-list-item__poster-placeholder" aria-hidden="true">
        {{ show.name.charAt(0).toUpperCase() }}
      </div>
    </div>
    <div class="show-list-item__body">
      <header>
        <h3>{{ show.name }}</h3>
        <span v-if="rating" class="show-list-item__rating">⭐ {{ rating.toFixed(1) }}</span>
      </header>
      <p v-if="summaryText">{{ summaryText }}</p>
      <ul v-if="show.genres.length" class="show-list-item__genres">
        <li v-for="genre in show.genres" :key="genre">{{ genre }}</li>
      </ul>
    </div>
  </RouterLink>
</template>

<style scoped lang="scss">
.show-list-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: rgba(42, 8, 14, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: inherit;
  text-decoration: none;
  transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
}

.show-list-item:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 45, 85, 0.45);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
}

.show-list-item__poster {
  width: 96px;
  border-radius: 0.75rem;
  overflow: hidden;
  aspect-ratio: 2 / 3;
  background: linear-gradient(145deg, rgba(68, 12, 20, 0.9), rgba(32, 6, 12, 0.92));
}

.show-list-item__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.show-list-item__poster-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
}

.show-list-item__body {
  display: grid;
  gap: 0.5rem;
}

.show-list-item__body header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.show-list-item__body h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: white;
}

.show-list-item__rating {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  color: #ffdd57;
  font-size: 0.8rem;
  font-weight: 600;
}

.show-list-item__body p {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.45;
}

.show-list-item__genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.show-list-item__genres li {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.7rem;
  white-space: nowrap;
  background: rgba(255, 45, 85, 0.18);
  color: rgba(255, 135, 155, 0.92);
}

@media (max-width: 540px) {
  .show-list-item {
    grid-template-columns: 72px 1fr;
    gap: 0.75rem;
    padding: 0.75rem 0.85rem;
  }

  .show-list-item__poster {
    width: 72px;
  }

  .show-list-item__body h3 {
    font-size: 1rem;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import type { TVMazeShow } from '@/types/tvmaze';
import ShowCard from '@/components/ShowCard.vue';

const props = defineProps<{
  genre: string;
  shows: TVMazeShow[];
}>();

const subtitle = computed(() => {
  const count = props.shows.length;
  return count === 1 ? '1 show' : `${count} shows`;
});
</script>

<template>
  <section class="genre-rail" :aria-label="`${genre} shows`">
    <header class="genre-rail__header">
      <h2 class="genre-rail__title">{{ genre }}</h2>
      <span class="genre-rail__meta">{{ subtitle }}</span>
    </header>
    <div class="genre-rail__track" role="list">
      <div v-for="show in shows" :key="show.id" class="genre-rail__item" role="listitem">
        <ShowCard :show="show" />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.genre-rail {
  display: grid;
  gap: 1rem;
}

.genre-rail__header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.genre-rail__title {
  margin: 0;
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 700;
  color: white;
}

.genre-rail__meta {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.55);
}

.genre-rail__track {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.75rem;
}

.genre-rail__track::-webkit-scrollbar {
  height: 6px;
}

.genre-rail__track::-webkit-scrollbar-thumb {
  background: rgba(255, 45, 85, 0.5);
}

.genre-rail__item {
  flex: 0 0 auto;
  display: flex;
}

.genre-rail__item :deep(.show-card) {
  width: 200px;
  min-width: 200px;
}

@media (max-width: 720px) {
  .genre-rail__header {
    flex-direction: column;
    gap: 0.35rem;
  }
}
</style>

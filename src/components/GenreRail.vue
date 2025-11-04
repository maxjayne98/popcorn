<script setup lang="ts">
import { computed } from 'vue';
import type { TVMazeShow } from '@/types/tvmaze';
import ShowCard from '@/components/ShowCard.vue';
import VirtualHorizontalList from '@/components/VirtualHorizontalList.vue';

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
    <VirtualHorizontalList
      :items="shows"
      :item-width="200"
      :item-gap="16"
      :item-height="428"
      role="list"
      class="genre-rail__list"
    >
      <template #default="{ item }">
        <ShowCard :show="item as TVMazeShow" />
      </template>
    </VirtualHorizontalList>
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

.genre-rail__list {
  padding-bottom: 0.75rem;
}

.genre-rail__list ::v-deep(.virtual-rail__cell) {
  margin-right: 0;
}

.genre-rail__list ::v-deep(.virtual-rail__cell:last-child) {
  margin-right: 0;
}

.genre-rail__list ::v-deep(.virtual-rail__items) {
  gap: 16px;
}

.genre-rail__list ::v-deep(.virtual-rail__cell > *) {
  width: 100%;
}

@media (max-width: 720px) {
  .genre-rail__header {
    flex-direction: column;
    gap: 0.35rem;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import ShowCard from '@/components/ShowCard.vue';
import VirtualHorizontalList from '@/components/VirtualHorizontalList.vue';
import type { TVMazeShow } from '@/types/tvmaze';

const props = defineProps<{
  shows: readonly TVMazeShow[];
}>();

const showsArray = computed(() => [...props.shows]);
</script>

<template>
  <section v-if="shows.length" class="page-section watchlist">
    <header class="section-header">
      <h2>Your Watchlist</h2>
      <p>Shows you pinned for later.</p>
    </header>
    <VirtualHorizontalList
      :items="showsArray"
      :item-width="200"
      :item-gap="16"
      :item-height="428"
      role="list"
      class="watchlist__rail"
    >
      <template #default="{ item }">
        <ShowCard :show="item as TVMazeShow" />
      </template>
    </VirtualHorizontalList>
  </section>
</template>

<style scoped lang="scss">
.page-section {
  display: grid;
  gap: 1.5rem;
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

.watchlist__rail {
  padding-bottom: 0.75rem;
}

.watchlist__rail ::v-deep(.virtual-rail__cell) {
  margin-right: 0;
}

.watchlist__rail ::v-deep(.virtual-rail__cell:last-child) {
  margin-right: 0;
}

.watchlist__rail ::v-deep(.virtual-rail__items) {
  gap: 16px;
}

.watchlist__rail ::v-deep(.virtual-rail__cell > *) {
  width: 100%;
}
</style>


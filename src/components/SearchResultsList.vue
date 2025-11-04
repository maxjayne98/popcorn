<script setup lang="ts">
import type { TVMazeShow } from '@/types/tvmaze';
import SearchResultItem from '@/components/SearchResultItem.vue';

defineProps<{
  shows: TVMazeShow[];
}>();
</script>

<template>
  <section class="search-results">
    <div v-if="shows.length" class="search-results__list" role="list">
      <SearchResultItem
        v-for="show in shows"
        :key="show.id"
        :show="show"
        role="listitem"
      />
    </div>
    <p v-else class="search-results__empty">
      Try refining your search keywords to find the show you are looking for.
    </p>
  </section>
</template>

<style scoped lang="scss">
.search-results {
  display: grid;
  gap: clamp(1rem, 2vw, 2.5rem);
}

.search-results__list {
  display: grid;
  gap: clamp(1rem, 2.5vw, 2rem);
}

.search-results__empty {
  margin: 0;
  padding: 2rem 0;
  text-align: center;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>

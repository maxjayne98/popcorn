<script setup lang="ts">
import type { TVMazeShow } from '@/types/tvmaze';
import ShowCard from '@/components/ShowCard.vue';

defineProps<{
  shows: TVMazeShow[];
}>();
</script>

<template>
  <section class="search-results">
    <div v-if="shows.length" class="search-results__grid" role="list">
      <ShowCard
        v-for="show in shows"
        :key="show.id"
        :show="show"
        class="search-results__card"
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
  gap: 1rem;
}

.search-results__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding-bottom: 2rem;
}

.search-results__empty {
  margin: 0;
  padding: 2rem 0;
  text-align: center;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>

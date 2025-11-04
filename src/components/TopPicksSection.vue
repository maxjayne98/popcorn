<script setup lang="ts">
import { computed } from 'vue';
import ShowCard from '@/components/ShowCard.vue';
import ShowFilters from '@/components/ShowFilters.vue';
import VirtualHorizontalList from '@/components/VirtualHorizontalList.vue';
import type { TVMazeShow } from '@/types/tvmaze';

type RuntimeFilter = 'all' | 'short' | 'medium' | 'long';

const props = defineProps<{
  shows: readonly TVMazeShow[];
  allShows: readonly TVMazeShow[];
  runtimeFilter: RuntimeFilter;
  languageFilter: string;
  networkFilter: string;
}>();

const emit = defineEmits<{
  'update:runtimeFilter': [value: RuntimeFilter];
  'update:languageFilter': [value: string];
  'update:networkFilter': [value: string];
}>();

function matchesFilters(show: TVMazeShow) {
  const runtime = show.runtime ?? 0;
  if (props.runtimeFilter === 'short' && runtime >= 30) {
    return false;
  }
  if (props.runtimeFilter === 'medium' && (runtime < 30 || runtime > 60)) {
    return false;
  }
  if (props.runtimeFilter === 'long' && runtime <= 60) {
    return false;
  }

  if (props.languageFilter !== 'all' && show.language !== props.languageFilter) {
    return false;
  }

  if (props.networkFilter !== 'all') {
    const networkName = show.network?.name ?? '';
    if (networkName !== props.networkFilter) {
      return false;
    }
  }

  return true;
}

const filteredShows = computed(() => props.shows.filter(matchesFilters));
</script>

<template>
  <section v-if="shows.length" class="page-section top-watch">
    <header class="section-header">
      <h2>Top Picks For You</h2>
      <p>Curated from the highest-rated shows right now.</p>
    </header>
    <ShowFilters
      :all-shows="allShows"
      :runtime-filter="runtimeFilter"
      :language-filter="languageFilter"
      :network-filter="networkFilter"
      @update:runtime-filter="emit('update:runtimeFilter', $event)"
      @update:language-filter="emit('update:languageFilter', $event)"
      @update:network-filter="emit('update:networkFilter', $event)"
    />
    <p v-if="!filteredShows.length" class="state">No picks match the selected filters yet.</p>
    <VirtualHorizontalList
      v-else
      :items="filteredShows"
      :item-width="200"
      :item-gap="16"
      :item-height="428"
      role="list"
      class="top-watch__rail"
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

.top-watch__rail {
  padding-bottom: 0.75rem;
}

.top-watch__rail ::v-deep(.virtual-rail__cell) {
  margin-right: 0;
}

.top-watch__rail ::v-deep(.virtual-rail__cell:last-child) {
  margin-right: 0;
}

.top-watch__rail ::v-deep(.virtual-rail__items) {
  gap: 16px;
}

.top-watch__rail ::v-deep(.virtual-rail__cell > *) {
  width: 100%;
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

.top-watch .section-header p {
  color: rgba(255, 255, 255, 0.65);
}

.state {
  margin: 0;
  padding: 1.5rem;
  text-align: center;
  background: var(--surface-color);
  border-radius: 1rem;
}
</style>


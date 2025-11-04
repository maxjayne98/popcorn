<script setup lang="ts">
import { computed } from 'vue';
import ShowCard from '@/components/ShowCard.vue';
import VirtualHorizontalList from '@/components/VirtualHorizontalList.vue';
import type { TVMazeShow } from '@/types/tvmaze';

const props = defineProps<{
  shows: readonly TVMazeShow[];
}>();

const items = computed(() => [...props.shows]);

const emit = defineEmits<{
  remove: [id: number];
}>();
</script>

<template>
  <section v-if="shows.length" class="page-section recently-viewed">
    <header class="section-header">
      <h2>Continue Browsing</h2>
      <p>Jump back into shows you viewed recently.</p>
    </header>
    <VirtualHorizontalList
      :items="items"
      :item-width="200"
      :item-gap="16"
      :item-height="428"
      role="list"
      class="recently-viewed__rail"
    >
      <template #default="{ item }">
        <div class="recent-card">
          <ShowCard :show="item as TVMazeShow" />
          <button
            type="button"
            class="recent-card__remove"
            @click="emit('remove', (item as TVMazeShow).id)"
          >
            Remove
          </button>
        </div>
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

.recently-viewed__rail {
  padding-bottom: 0.75rem;
}

.recently-viewed__rail ::v-deep(.virtual-rail__cell) {
  margin-right: 0;
}

.recently-viewed__rail ::v-deep(.virtual-rail__cell:last-child) {
  margin-right: 0;
}

.recently-viewed__rail ::v-deep(.virtual-rail__items) {
  gap: 16px;
}

.recently-viewed__rail ::v-deep(.virtual-rail__cell > *) {
  width: 100%;
}

.recent-card {
  position: relative;
  display: grid;
}

.recent-card__remove {
  position: absolute;
  top: 0.8rem;
  left: 0.6rem;
  z-index: 2;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(16, 8, 24, 0.75);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
}

.recent-card__remove:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(30, 16, 44, 0.85);
}
</style>

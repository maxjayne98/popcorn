<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { SavedSearch } from '@/stores/searchCollections';
import ImdbIcon from '@/components/icons/ImdbIcon.vue';

defineProps<{
  searches: readonly SavedSearch[];
}>();

const emit = defineEmits<{
  remove: [id: string];
}>();

const router = useRouter();

function applySavedSearch(entry: SavedSearch) {
  router
    .push({
      name: 'search-results',
      query: {
        q: entry.query,
        ...(entry.minRating ? { minRating: entry.minRating.toString() } : {}),
      },
    })
    .catch(() => {
      /* ignore redundant navigation */
    });
}
</script>

<template>
  <section v-if="searches.length" class="page-section saved-searches">
    <header class="section-header">
      <h2>Saved Searches</h2>
      <p>Quick shortcuts for your favourite queries.</p>
    </header>
    <ul class="saved-searches__list">
      <li v-for="entry in searches" :key="entry.id">
        <button type="button" @click="applySavedSearch(entry)">
          {{ entry.label }} (min
          <span class="saved-searches__rating">
            <ImdbIcon aria-hidden="true" />
            {{ entry.minRating.toFixed(1) }}
          </span>
          )
        </button>
        <button type="button" class="saved-searches__remove" @click="emit('remove', entry.id)">
          Remove
        </button>
      </li>
    </ul>
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

.saved-searches__list {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.saved-searches__list li {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.saved-searches__list button {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(18, 10, 26, 0.75);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  cursor: pointer;
}

.saved-searches__rating {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: 0.25rem;
}

.saved-searches__rating svg {
  width: 1.1rem;
  height: auto;
}

.saved-searches__remove {
  background: rgba(255, 55, 95, 0.18) !important;
  border-color: rgba(255, 55, 95, 0.4) !important;
  color: rgba(255, 175, 185, 0.9) !important;
}
</style>
